const mongoose = require("mongoose");
const schema = mongoose.Schema;

const passwordSchema = new schema(
  {
    title: { type: String, required: true },
    id: { type: String, required: true },
    password: { type: String, required: true },
    remarks: { type: String },
    others: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Password", passwordSchema);
