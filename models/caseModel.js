const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const caseSchema = new Schema(
  {
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    score: { type: Number, required: true },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Case", caseSchema);
