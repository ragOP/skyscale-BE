const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    default: "",
  },
  email: {
    type: String,
    default: "",
  },
  phoneNumber: {
    type: String,
    default: "",
  },
  dob: {
    type: Date,
    default: "",
  },
  gender: {
    type: String,
    default: "",
  },
  placeOfBirth: {
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
  deliveryStatusEmail: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model("Order777", orderSchema);
