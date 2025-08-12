// routers/phonepeV2/index.js
const express = require("express");
const axios = require("axios");
const router = express.Router();
const { CFG, getAuthToken } = require("../../config/phonePeV2");

// public redirect (can be same page for both success/failure; we’ll show status there)
const PUBLIC_REDIRECT_URL =
  // "http://easyastro.in";
  "http://localhost:9002";

/**
 * POST /api/phonepe-v2/pay
 * body: { amount (INR), name?, mobile? }
 * returns: { redirectUrl, merchantOrderId }
 */
router.post("/pay", async (req, res) => {
  try {
    const { amount, name = "", mobile = "" } = req.body || {};
    const rupees = Number(amount || 0);
    if (!rupees || rupees < 1) {
      return res
        .status(400)
        .json({ success: false, error: "Valid amount (>= 1 INR) required" });
    }

    const merchantOrderId = `ord_${Date.now()}_${Math.floor(
      Math.random() * 1e5
    )}`;
    const payload = {
      merchantOrderId,
      amount: Math.round(rupees * 100), // paisa
      expireAfter: 1200, // 20 minutes
      metaInfo: {
        udf1: name || "",
        udf2: mobile || "",
      },
      paymentFlow: {
        type: "PG_CHECKOUT",
        merchantUrls: {
          redirectUrl: `http://easyastro.in/order-confirmation?orderId=${merchantOrderId}`,
        },
        // OPTIONAL: control visible instruments at checkout
        // paymentModeConfig: { enabledPaymentModes: [ { type: "UPI_INTENT" }, { type: "CARD", cardTypes:["DEBIT_CARD","CREDIT_CARD"] } ] }
      },
    };

    const token = await getAuthToken();
    const resp = await axios.post(CFG.payUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `O-Bearer ${token}`,
      },
      timeout: 20000,
    });

    const data = resp.data || {};
    if (!data.redirectUrl) {
      return res.status(400).json({
        success: false,
        error: data.message || "No redirectUrl",
        raw: data,
      });
    }

    return res.status(200).json({
      success: true,
      data: { redirectUrl: data.redirectUrl, merchantOrderId },
    });
  } catch (err) {
    console.error("PhonePe v2 /pay error", err?.response?.data || err.message);
    return res
      .status(500)
      .json({ success: false, error: err?.response?.data || err.message });
  }
});

/**
 * GET /api/phonepe-v2/status/:merchantOrderId
 * Uses Order Status v2.
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
    console.error(
      "PhonePe v2 /status error",
      err?.response?.data || err.message
    );
    return res
      .status(500)
      .json({ success: false, error: err?.response?.data || err.message });
  }
});

/**
 * (Optional) POST /api/phonepe-v2/webhook
 * For final state callbacks — you must configure this URL in PhonePe dashboard.
 * v2 webhooks use token auth (not X-VERIFY) for Standard Checkout; verify per docs if you enable.
 */
router.post("/webhook", express.json({ type: "*/*" }), async (req, res) => {
  try {
    // TODO: validate authorization header per PhonePe webhook setup (if configured)
    // Then read body and update your DB (order completed/failed, attempts, UTR, etc.)
    console.log("PhonePe v2 webhook body:", req.body);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("PhonePe v2 webhook error:", e.message);
    return res.status(500).json({ ok: false });
  }
});

module.exports = router;
