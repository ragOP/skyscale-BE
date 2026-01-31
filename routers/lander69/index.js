const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const razorpayLander69 = require("../../config/razorpayLander69");
const Order69 = require("../../models/orderModel69");
const Order69Abd = require("../../models/orderModel69-abd");

// Razorpay order creation (same as /api/payment & /api/payment2): POST /razorpay { amount }
router.post("/razorpay", async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    const { amount } = req.body;

    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid amount. Expected a positive number.",
      });
    }

    const razorpayOrder = await razorpayLander69.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      payment_capture: 1,
    });

    console.log("Razorpay Order Created:", razorpayOrder);
    return res.status(200).json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        signature: razorpayOrder.signature,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/lander69/create-order
 * Verifies Razorpay signature and stores order.
 */
router.post("/create-order", async (req, res) => {
  const {
    amount,
    orderId,
    name,
    fullName,
    email,
    phone,
    phoneNumber,
    dateOfBirth,
    dob,
    gender,
    placeOfBirth,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    additionalProducts = [],
  } = req.body;

  try {
    const secret = process.env.RAZORPAY_LANDER69_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "RAZORPAY_LANDER69_SECRET is not set on server",
      });
    }

    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(String(razorpayOrderId || "") + "|" + String(razorpayPaymentId || ""));
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Invalid Payment",
      });
    }

    const resolvedOrderId =
      orderId || razorpayOrderId || `ORDER_${Date.now()}`;

    const existingOrder = await Order69.findOne({ orderId: resolvedOrderId });
    if (existingOrder) {
      return res.status(200).json({
        success: true,
        data: existingOrder,
      });
    }

    const payload = {
      amount,
      orderId: resolvedOrderId,
      fullName: fullName || name || "",
      email: email || "",
      phoneNumber: phoneNumber || phone || "",
      dob: dob || dateOfBirth || "",
      gender: gender || "",
      placeOfBirth: placeOfBirth || "",
      razorpayOrderId: razorpayOrderId || "",
      razorpayPaymentId: razorpayPaymentId || "",
      razorpaySignature: razorpaySignature || "",
      additionalProducts,
    };

    const order = await Order69.create(payload);
    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Abandoned cart/order capture (DB only)
 * POST /api/lander69/create-order-abd  (and alias /abandoned-order)
 */
async function createAbandonedOrder(req, res) {
  const {
    amount,
    name,
    fullName,
    email,
    phone,
    phoneNumber,
    dateOfBirth,
    dob,
    gender,
    placeOfBirth,
    additionalProducts = [],
  } = req.body;

  try {
    const abandonedOrder = await Order69Abd.create({
      abdOrderId: `ord_${Date.now()}_${Math.floor(Math.random() * 1e5)}`,
      amount,
      fullName: fullName || name || "",
      email: email || "",
      phoneNumber: phoneNumber || phone || "",
      dob: dob || dateOfBirth || "",
      gender: gender || "",
      placeOfBirth: placeOfBirth || "",
      additionalProducts,
    });

    return res.status(200).json({
      success: true,
      data: abandonedOrder,
      message: "Abandoned order created successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

router.post("/create-order-abd", createAbandonedOrder);
router.post("/abandoned-order", createAbandonedOrder); // alias used by some landers

/**
 * DELETE abandoned orders by email
 * Supports body { email } or query ?email=
 */
async function deleteAbandonedOrder(req, res) {
  const email = req.body?.email || req.query?.email;

  if (!email) {
    return res.status(400).json({ success: false, error: "email required" });
  }

  try {
    const result = await Order69Abd.deleteMany({ email });
    return res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
      message: "Abandoned cart deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

router.delete("/delete-order-abd", deleteAbandonedOrder);
router.delete("/delete-abandoned-order", deleteAbandonedOrder); // alias

/**
 * GET /api/lander69/get-orders
 */
router.get("/get-orders", async (req, res) => {
  const orders = await Order69.find({}).sort({ createdAt: -1 });
  return res.status(200).json({
    success: true,
    data: orders,
  });
});

/**
 * GET /api/lander69/get-orders-abd  (and alias /get-abandoned-orders)
 */
router.get("/get-orders-abd", async (req, res) => {
  const orders = await Order69Abd.find({}).sort({ createdAt: -1 });
  return res.status(200).json({
    success: true,
    data: orders,
  });
});

router.get("/get-abandoned-orders", async (req, res) => {
  const orders = await Order69Abd.find({}).sort({ createdAt: -1 });
  return res.status(200).json({
    success: true,
    data: orders,
  });
});

/**
 * Paginated endpoints (same style as other landers)
 */
router.get("/get-order/main", async (req, res) => {
  const { page = 1, limit = 100 } = req.query;
  try {
    const orders = await Order69.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    return res.status(200).json({
      success: true,
      data: {
        orders,
        currentPage: page,
        totalPages: Math.ceil((await Order69.countDocuments()) / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/get-order/main-abd", async (req, res) => {
  const { page = 1, limit = 100 } = req.query;
  try {
    const orders = await Order69Abd.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    return res.status(200).json({
      success: true,
      data: {
        orders,
        currentPage: page,
        totalPages: Math.ceil((await Order69Abd.countDocuments()) / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch("/delivery-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deliveryStatusEmail = req.body.deliveryStatusEmail;

    const order = await Order69.findByIdAndUpdate(
      id,
      { deliveryStatusEmail: deliveryStatusEmail },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;

