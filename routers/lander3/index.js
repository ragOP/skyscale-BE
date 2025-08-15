// routers/lander3/index.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const orderModel3 = require("../../models/oderModel3");
const orderModel3Abd = require("../../models/oderModel3-abd");

const { sendEmail } = require("../../utils/mailer"); // Nodemailer encapsulated
const { orderConfirmationHTML } = require("../../emails/orderConfirmation");

/** Helper: build & send confirmation email (fire-and-forget) */
async function sendConfirmationEmail({ email, name, orderId, amount, additionalProducts = [] }) {
  if (!email) {
    console.warn("[order-email] No email provided; skipping send.");
    return;
  }

  // Minimal line items: single line with total; add-ons listed separately
  const items = [{ title: "Soulmate Sketch Order", price: Number(amount || 0) }];

  const html = orderConfirmationHTML({
    customerName: name || "",
    orderId,
    amount: Number(amount || 0),
    items,
    additionalProducts,
  });

  // Optional admin BCC (set in .env)
  const adminBcc = process.env.ADMIN_ORDER_BCC || "";

  await sendEmail({
    to: email,
    subject: `Your AstraSoul Order is Confirmed (#${orderId})`,
    html,
    // If you want BCC for internal tracking:
    ...(adminBcc ? { bcc: adminBcc } : {}),
  });
}

/**
 * POST /api/lander3/create-order
 * Razorpay path: verifies signature, creates order, sends email
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

    // Send confirmation email (non-blocking)
    (async () => {
      try {
        await sendConfirmationEmail({
          email,
          name,
          orderId: orderId || razorpayOrderId || `ORDER_${Date.now()}`,
          amount,
          additionalProducts,
        });
        console.log(`[order-email] Confirmation sent to ${email}`);
      } catch (mailErr) {
        console.error("[order-email] Send failed:", mailErr?.message || mailErr);
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
 * Remove abandoned-cart record
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
 * PhonePe path: creates order (no signature verification here), sends email
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

    // Send confirmation email (non-blocking)
    (async () => {
      try {
        await sendConfirmationEmail({
          email,
          name,
          orderId: orderId || `ORDER_${Date.now()}`,
          amount,
          additionalProducts,
        });
        console.log(`[order-email] (PhonePe) Confirmation sent to ${email}`);
      } catch (mailErr) {
        console.error("[order-email] (PhonePe) Send failed:", mailErr?.message || mailErr);
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

module.exports = router;
