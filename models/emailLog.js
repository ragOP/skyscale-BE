// models/emailLog.js
const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema(
  {
    // who/what
    toEmail: { type: String, index: true },
    bcc: { type: String, default: "" },
    subject: String,

    // associate with your order (optional but useful)
    orderId: { type: String, index: true },

    // mailer result
    status: { type: String, enum: ["accepted", "rejected", "error"], required: true },
    accepted: { type: [String], default: [] },
    rejected: { type: [String], default: [] },
    response: { type: String, default: "" },
    messageId: { type: String, index: true },

    // raw error (if any)
    errorMessage: { type: String, default: "" },

    // payload snapshot (optional; don’t store full HTML if you don’t want)
    meta: {
      amount: Number,
      name: String,
      additionalProducts: [String],
    },

    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.models.EmailLog || mongoose.model("EmailLog", emailLogSchema);
