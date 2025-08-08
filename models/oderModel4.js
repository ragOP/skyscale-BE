const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
  },
  email: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  profession: {
    type: String,
  },
  remarks: {
    type: String,
    default: "",
  },
  orderDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  amount: {
    type: Number,
    required: true,
  },
  razorpayOrderId: {
    type: String,
  },
  razorpayPaymentId: {
    type: String,
  },
  additionalProducts: {
    type: [String],
    default: [],
  },
}, { timestamps: true });

module.exports = mongoose.model("Order4", orderSchema);
