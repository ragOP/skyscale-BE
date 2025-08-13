const express = require("express");
const router = express.Router();
const orderModel3 = require("../../models/oderModel3");
const orderModel3Abd = require("../../models/oderModel3-abd");
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
    const order = await orderModel3.create(payload);
    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

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
    // const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
    // hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
    // const generatedSignature = hmac.digest("hex");

    // if (generatedSignature !== razorpaySignature) {
    //   return res.status(400).json({
    //     success: false,
    //     data: null,
    //     message: "Invalid Payment",
    //   });
    // }
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
    return res.status(500).json({ error: error.message });
  }
});

router.delete("/delete-order-abd/:id", async (req, res) => {
  const { id } = req.params;
  if (!id)
    return res.status(400).json({ success: false, error: "id required" });

  console.log(id);

  try {
    const order = await orderModel3Abd.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      data: order,
      message: "Abandoned Order deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

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
    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/get-orders", async (req, res) => {
  const orders = await orderModel3.find({}).sort({ createdAt: -1 });
  return res.status(200).json({
    success: true,
    data: orders,
  });
});

module.exports = router;
