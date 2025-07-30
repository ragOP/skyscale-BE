require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const crypto = require("crypto");
const mongoose = require("mongoose");
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const { connectToDatabase } = require("./config");
const razorpay = require("./razorpay");
const orderModel = require("./orderModel");

connectToDatabase(MONGO_URI);

app.use(cors());
app.use(express.json());

app.post("/api/payment/razorpay", async (req, res) => {
  try {
    const { amount } = req.body;
    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      payment_capture: 1,
    });
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

app.post("/api/create-order", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  const {
    amount,
    orderId,
    name,
    email,
    phone,
    dateOfBirth,
    gender,
    placeOfBirth,
    preferredDateTime,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
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
      prefferedDateAndTime: preferredDateTime,
      razorpayOrderId,
      razorpayPaymentId,
    };
    const order = await orderModel.create([payload], { session });
    await session.commitTransaction();
    session.endSession();
    return res.status(200).json({
      success: true,
      data: order[0],
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/get-orders", async (req, res) => {
  const orders = await orderModel.find({});
  return res.status(200).json({
    success: true,
    data: orders,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
