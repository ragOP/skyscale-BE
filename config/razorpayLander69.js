const Razorpay = require("razorpay");

// Dedicated Razorpay instance for lander69 (Live credentials via env)
const razorpayLander69 = new Razorpay({
  key_id: process.env.RAZORPAY_LANDER69_KEY_ID || "rzp_live_SARZDGt0MIGM8u",
  key_secret: process.env.RAZORPAY_LANDER69_SECRET,
});

module.exports = razorpayLander69;
