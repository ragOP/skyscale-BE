const express = require("express");
const router = express.Router();
const razorpay = require("../../config/razorpay");
const PaymentController = require("../cashfree/index");

router.post("/razorpay", async (req, res) => {
  try {
    console.log("Request Body:", req.body); // Debugging line
    const { amount } = req.body;
    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      payment_capture: 1,
    });
    console.log("Razorpay Order Created:", razorpayOrder); // Debugging line
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

router.post("/create-session", PaymentController.createCashfreeSession);

router.get("/details/:id", PaymentController.getCashfreePaymentDetails);

module.exports = router;
