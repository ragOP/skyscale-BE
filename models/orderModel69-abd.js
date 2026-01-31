const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    abdOrderId: {
      type: String,
      required: true,
      unique: true,
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
    additionalProducts: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order69Abd", orderSchema);

