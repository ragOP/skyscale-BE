const { mongoose, Schema } = require("mongoose");

const order6Schema = new Schema(
  {
    fullName: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    dob: { type: Date },
    items: [
      {
        title: { type: String },
        price: { type: Number },
      },
    ],
    orderId: { type: String },
    status: { type: String },
    razorPayOrderId: { type: String },
    razorPayPaymentId: { type: String },
    razorPaySignatureId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order6", order6Schema);
