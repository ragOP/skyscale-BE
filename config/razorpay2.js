const Razorpay = require('razorpay');

const razorpay2 = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID_2,
  key_secret: process.env.RAZORPAY_SECRET_2,
});

module.exports = razorpay2;