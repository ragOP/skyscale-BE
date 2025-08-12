// routers/phonepeV2/index.js
const express = require("express");
const axios = require("axios");
const router = express.Router();
const { CFG, getAuthToken } = require("../../config/phonePeV2");

// Toggle this when you deploy:
const PUBLIC_REDIRECT_URL =
  // "https://easyastro.in"; // prod
  "http://localhost:9002";    // dev

// ============================
// Small helpers
// ============================

/** Sleep helper */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Parse Retry-After header (seconds or HTTP-date). Fallback to 2s. */
function parseRetryAfter(headers, fallbackSeconds = 2) {
  const ra = headers?.["retry-after"];
  if (!ra) return fallbackSeconds * 1000;
  const n = Number(ra);
  if (!Number.isNaN(n)) return Math.max(0, n) * 1000;
  const when = Date.parse(ra);
  if (!Number.isNaN(when)) return Math.max(0, when - Date.now());
  return fallbackSeconds * 1000;
}

/** Exponential backoff with jitter */
function nextBackoff(attempt, baseMs = 400) {
  const exp = Math.min(7, attempt);
  const ms = baseMs * Math.pow(2, exp);
  const jitter = Math.floor(Math.random() * 200);
  return ms + jitter;
}

/** Simple unique Order ID if client does not send one */
function genOrderId(prefix = "ord") {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)
    .toString()
    .padStart(6, "0")}`;
}

/**
 * POST wrapper with 429 handling (Retry-After + backoff)
 * @param {string} url
 * @param {object} payload
 * @param {object} headers
 * @param {number} maxAttempts
 */
async function postWith429(url, payload, headers, maxAttempts = 3) {
  let attempt = 0;
  let lastErr = null;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      const resp = await axios.post(url, payload, {
        headers,
        timeout: 20000,
      });
      return { resp, attempt };
    } catch (err) {
      const httpStatus = err?.response?.status;

      // If 429 -> respect Retry-After, then backoff
      if (httpStatus === 429) {
        const waitMs = parseRetryAfter(err.response.headers);
        const backoff = attempt > 1 ? nextBackoff(attempt) : 0;
        const totalWait = waitMs + backoff;
        // console.warn(`[PhonePe v2] 429. Waiting ${totalWait}ms before retry #${attempt + 1}`);
        await sleep(totalWait);
        lastErr = err;
        continue;
      }

      // If 5xx or network -> exponential backoff and retry
      if (!err.response || (httpStatus >= 500 && httpStatus <= 599)) {
        const wait = nextBackoff(attempt);
        // console.warn(`[PhonePe v2] ${httpStatus || "NETWORK"} error. Backing off ${wait}ms before retry #${attempt + 1}`);
        await sleep(wait);
        lastErr = err;
        continue;
      }

      // Other 4xx -> do not retry
      lastErr = err;
      break;
    }
  }

  // If we’re here, all attempts failed
  throw lastErr;
}

// ============================
// Micro throttle (per-IP)
// ============================
// Prevents the same IP from hitting /pay more than once per second
const ipHits = new Map(); // ip -> lastTimestampMs
const MIN_MS_BETWEEN_PAY = 1000;

/** throttle middleware for /pay */
function throttlePay(req, res, next) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown";

  const now = Date.now();
  const last = ipHits.get(ip) || 0;
  if (now - last < MIN_MS_BETWEEN_PAY) {
    return res
      .status(429)
      .json({ success: false, error: "Too many requests, please try again." });
  }
  ipHits.set(ip, now);
  return next();
}

// ============================
// ROUTES
// ============================

/**
 * POST /api/phonepe-v2/pay
 * body: { amount (INR), name?, mobile?, merchantOrderId? }
 * returns: { redirectUrl, merchantOrderId }
 */
router.post("/pay", throttlePay, async (req, res) => {
  try {
    const {
      amount,
      name = "",
      mobile = "",
      merchantOrderId: inputOrderId,
    } = req.body || {};
    const rupees = Number(amount || 0);

    if (!rupees || rupees < 1) {
      return res
        .status(400)
        .json({ success: false, error: "Valid amount (>= 1 INR) required" });
    }

    // Use provided order id, else generate one
    const merchantOrderId = inputOrderId || genOrderId("ord");

    // Build payload for PhonePe v2 create order
    const payload = {
      merchantOrderId,
      amount: Math.round(rupees * 100), // paise
      expireAfter: 1200, // seconds (20 min)
      metaInfo: {
        udf1: name || "",
        udf2: mobile || "",
      },
      paymentFlow: {
        type: "PG_CHECKOUT",
        merchantUrls: {
          // You can use a single page and let it poll /status and show success/failure
          redirectUrl: `${PUBLIC_REDIRECT_URL}/order-confirmation?orderId=${encodeURIComponent(
            merchantOrderId
          )}`,
        },
        // Example to restrict instruments:
        // paymentModeConfig: {
        //   enabledPaymentModes: [
        //     { type: "UPI_INTENT" },
        //     { type: "CARD", cardTypes: ["DEBIT_CARD", "CREDIT_CARD"] },
        //   ],
        // },
      },
    };

    const token = await getAuthToken();
    const headers = {
      "Content-Type": "application/json",
      Authorization: `O-Bearer ${token}`,
    };

    // Use our robust 429-safe wrapper
    const { resp, attempt } = await postWith429(CFG.payUrl, payload, headers, 3);
    const data = resp?.data || {};

    if (!data.redirectUrl) {
      return res.status(400).json({
        success: false,
        error: data.message || "No redirectUrl from PhonePe",
        raw: data,
      });
    }

    return res.status(200).json({
      success: true,
      attempt,
      data: { redirectUrl: data.redirectUrl, merchantOrderId },
    });
  } catch (err) {
    const http = err?.response?.status || 500;
    const body = err?.response?.data || err.message;
    console.error("PhonePe v2 /pay error", body);
    return res.status(http).json({ success: false, error: body });
  }
});

/**
 * GET /api/phonepe-v2/status/:merchantOrderId
 * Uses Order Status v2 (with details & errorContext).
 */
router.get("/status/:merchantOrderId", async (req, res) => {
  try {
    const { merchantOrderId } = req.params;
    if (!merchantOrderId)
      return res
        .status(400)
        .json({ success: false, error: "merchantOrderId required" });

    const token = await getAuthToken();
    const url = `${CFG.statusBase}/${encodeURIComponent(
      merchantOrderId
    )}/status`;

    const resp = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `O-Bearer ${token}`,
      },
      timeout: 15000,
      params: {
        details: true,
        errorContext: true,
      },
    });

    return res.status(200).json({ success: true, data: resp.data });
  } catch (err) {
    const http = err?.response?.status || 500;
    const body = err?.response?.data || err.message;
    console.error("PhonePe v2 /status error", body);
    return res.status(http).json({ success: false, error: body });
  }
});

/**
 * POST /api/phonepe-v2/webhook
 * Configure this URL in PhonePe dashboard (if you’re using webhooks).
 * Validate the Authorization scheme per v2 docs (token-based for Standard Checkout).
 */
router.post("/webhook", express.json({ type: "*/*" }), async (req, res) => {
  try {
    // TODO: Validate the incoming auth header / token.
    // Example:
    // const auth = req.headers.authorization || "";
    // if (!auth.startsWith("Bearer ")) return res.status(401).json({ ok: false });

    // Process webhook:
    // - Read req.body
    // - Update your order DB: mark success/failure, store UTR/reference, etc.
    console.log("PhonePe v2 webhook body:", req.body);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("PhonePe v2 webhook error:", e.message);
    return res.status(500).json({ ok: false });
  }
});

module.exports = router;
