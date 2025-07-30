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
  dob: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
  },
  placeOfBirth: {
    type: String,
  },
  nationality: {
    type: String,
  },
  orderDate: {
    type: Date,
    required: true,
  },
  prefferedDateAndTime: {
    type: Date,
    required: true,
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
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
