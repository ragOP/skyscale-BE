const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const caseSchema = new Schema(
  {
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    score: { type: Number, required: true },
    ms: { type: Number, default: 0 },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Case", caseSchema);
