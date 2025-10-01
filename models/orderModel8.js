const { mongoose, Schema } = require("mongoose");

const orderSchema = new Schema(
  {
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
    color: {
      type: String,
    },
    bundle: {
      type: String,
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
    addres: {
      type: String,
      default: "",
    },
    dob: {
      type: Date,
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
  },
  { timestamps: true }
);
module.exports = mongoose.model("orderModel8", orderSchema);
