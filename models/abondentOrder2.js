const mongoose = require("mongoose");

const abondentOrder2Schema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    dob: { type: Date },
    address: { type: String },
    orderId: { type: String },
    amount: { type: Number },
    items: [
      {
        title: {
          type: String,
        },
        price: {
          type: Number,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("AbondentOrder2", abondentOrder2Schema);
