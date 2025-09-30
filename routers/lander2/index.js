const express = require("express");
const router = express.Router();
const orderModel2 = require("../../models/oderModel2");
const crypto = require("crypto");

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
    const order = await orderModel2.create(payload);
    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/get-orders", async (req, res) => {
  const orders = await orderModel2.find({}).sort({ createdAt: -1 });
  return res.status(200).json({
    success: true,
    data: orders,
  });
});

router.get("/get-order/main", async (req, res) => {
  const { page = 1, limit = 100 } = req.query;
  try {
    const orders = await orderModel2
      .find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    return res.status(200).json({
      success: true,
      data: {
        orders,
        currentPage: page,
        totalPages: Math.ceil((await orderModel2.countDocuments()) / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
