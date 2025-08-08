const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  profession: {
    type: String,
    required: true,
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
