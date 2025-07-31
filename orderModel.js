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
    default: null,
  },
  gender: {
    type: String,
    default: null,
  },
  placeOfBirth: {
    type: String,
    default: null,
  },
  orderDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  prefferedDateAndTime: {
    type: String,
    required: true,
    default: "",
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

module.exports = mongoose.model("Order", orderSchema);
