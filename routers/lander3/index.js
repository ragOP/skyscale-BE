// routers/lander3/index.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const orderModel3 = require("../../models/oderModel3");
const orderModel3Abd = require("../../models/oderModel3-abd");

// NEW: email log model
const EmailLog = require("../../models/emailLog");

const { sendEmail } = require("../../utils/mailer");
const { orderConfirmationHTML } = require("../../emails/orderConfirmation");

/** Helper: send + log confirmation email (separate collection) */
async function sendAndLogConfirmationEmail({
  email,
  name,
  orderId,
  amount,
  additionalProducts = [],
}) {
  const adminBcc = process.env.ADMIN_ORDER_BCC || "";

  // minimal items summary (you can expand if you pass line items)
  const html = orderConfirmationHTML({
    customerName: name || "",
    orderId,
    amount: Number(amount || 0),
    items: [{ title: "Soulmate Sketch Order", price: Number(amount || 0) }],
    additionalProducts,
  });

  try {
    const info = await sendEmail({
      to: email,
      subject: `Your AstraSoul Order is Confirmed (#${orderId})`,
      html,
      bcc: adminBcc || undefined,
    });

    const accepted = Array.isArray(info.accepted) ? info.accepted : [];
    const rejected = Array.isArray(info.rejected) ? info.rejected : [];
    const status = accepted.length > 0 ? "accepted" : "rejected";

    await EmailLog.create({
      toEmail: email,
      bcc: adminBcc,
      subject: `Your AstraSoul Order is Confirmed (#${orderId})`,
      orderId,
      status,
      accepted,
      rejected,
      response: info.response || "",
      messageId: info.messageId || "",
      meta: { amount: Number(amount || 0), name, additionalProducts },
      sentAt: new Date(),
    });

    console.log(`[email-log] saved (${status}) for ${email} / ${orderId}`);
  } catch (err) {
    console.error("[order-email] send failed:", err?.message || err);
    await EmailLog.create({
      toEmail: email,
      bcc: adminBcc,
      subject: `Your AstraSoul Order is Confirmed (#${orderId})`,
      orderId,
      status: "error",
      accepted: [],
      rejected: [],
      response: "",
      messageId: "",
      errorMessage: err?.message || String(err),
      meta: { amount: Number(amount || 0), name, additionalProducts },
      sentAt: new Date(),
    });
  }
}

/**
 * POST /api/lander3/create-order
 * Razorpay path: verifies signature, creates order, THEN logs email send
 */
router.post("/create-order", async (req, res) => {
  const {
    amount,
    orderId,
    name,
    email,
    phone,
    dateOfBirth,
    gender,
    placeOfBirth,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    additionalProducts = [],
  } = req.body;

  try {
    // Verify Razorpay signature
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
    hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Invalid Payment",
      });
    }

    const payload = {
      amount,
      orderId,
      fullName: name,
      email,
      phoneNumber: phone,
      dob: dateOfBirth,
      gender,
      placeOfBirth,
      razorpayOrderId,
      razorpayPaymentId,
      additionalProducts,
      razorpaySignature,
    };

    const order = await orderModel3.create(payload);

    // Send & log email (non-blocking)
    (async () => {
      if (email) {
        await sendAndLogConfirmationEmail({
          email,
          name,
          orderId: orderId || razorpayOrderId || `ORDER_${Date.now()}`,
          amount,
          additionalProducts,
        });
      } else {
        console.warn("[order-email] no email in payload; skipping email + log");
      }
    })();

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("create-order error:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/lander3/create-order-abd
 * Create abandoned-cart record (no email here)
 */
router.post("/create-order-abd", async (req, res) => {
  const {
    amount,
    name,
    email,
    phone,
    dateOfBirth,
    gender,
    placeOfBirth,
    additionalProducts = [],
  } = req.body;

  try {
    const payload = {
      abdOrderId: `ord_${Date.now()}_${Math.floor(Math.random() * 1e5)}`,
      amount,
      fullName: name,
      email,
      phoneNumber: phone,
      dob: dateOfBirth,
      gender,
      placeOfBirth,
      additionalProducts,
    };

    const order = await orderModel3Abd.create(payload);

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("create-order-abd error:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/lander3/delete-order-abd/:id
 */
router.delete("/delete-order-abd/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, error: "id required" });
  }

  try {
    const order = await orderModel3Abd.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      data: order,
      message: "Abandoned Order deleted successfully",
    });
  } catch (error) {
    console.error("delete-order-abd error:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/lander3/create-order-phonepe
 * PhonePe path: creates order (no signature verification here), THEN logs email send
 */
router.post("/create-order-phonepe", async (req, res) => {
  const {
    amount,
    orderId,
    name,
    email,
    phone,
    dateOfBirth,
    gender,
    placeOfBirth,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    additionalProducts = [],
  } = req.body;

  try {
    const payload = {
      amount,
      orderId,
      fullName: name,
      email,
      phoneNumber: phone,
      dob: dateOfBirth,
      gender,
      placeOfBirth,
      razorpayOrderId,
      razorpayPaymentId,
      additionalProducts,
      razorpaySignature,
    };

    const order = await orderModel3.create(payload);

    // Send & log email (non-blocking)
    (async () => {
      if (email) {
        await sendAndLogConfirmationEmail({
          email,
          name,
          orderId: orderId || `ORDER_${Date.now()}`,
          amount,
          additionalProducts,
        });
      } else {
        console.warn("[order-email] no email in payload; skipping email + log");
      }
    })();

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("create-order-phonepe error:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/lander3/get-orders
 */
router.get("/get-orders", async (req, res) => {
  const orders = await orderModel3.find({}).sort({ createdAt: -1 });
  return res.status(200).json({
    success: true,
    data: orders,
  });
});

/**
 * GET /api/lander3/get-orders-abd
 */
router.get("/get-orders-abd", async (req, res) => {
  const orders = await orderModel3Abd.find({}).sort({ createdAt: -1 });
  return res.status(200).json({
    success: true,
    data: orders,
  });
});

/**
 * NEW: GET /api/lander3/get-email-sent
 * Returns all email logs (accepted/rejected/error). You can filter by status or date.
 * Optional query params:
 *   ?status=accepted|rejected|error
 *   ?from=2025-08-01&to=2025-08-15
 *   ?orderId=xyz
 *   ?email=user@example.com
 */
router.get("/get-email-sent", async (req, res) => {
  try {
    const { status, from, to, orderId, email } = req.query;
    const q = {};

    if (status) q.status = status;
    if (orderId) q.orderId = orderId;
    if (email) q.toEmail = email;

    if (from || to) {
      q.sentAt = {};
      if (from) q.sentAt.$gte = new Date(from);
      if (to) q.sentAt.$lte = new Date(to);
    }

    const logs = await EmailLog.find(q).sort({ sentAt: -1 });
    return res.status(200).json({ success: true, data: logs });
  } catch (err) {
    console.error("get-email-sent error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
