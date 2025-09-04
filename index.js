require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 9005;
const MONGO_URI = process.env.MONGO_URI;
const { connectToDatabase } = require("./config/config");

connectToDatabase(MONGO_URI);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    data: "Server is running",
  });
});

// ---------------------- Routers -----------------------//

// /api/payment/razorpay
app.use("/api/payment", require("./routers/payment/index"));

// ------ Astra Soul -----//
app.use("/api/lander1", require("./routers/lander1/index"));

// ------ Astra Love -----//
app.use("/api/lander2", require("./routers/lander2/index"));

// ----- SoulMate -----//
app.use("/api/lander3", require("./routers/lander3/index"));

// ---- Signature -----//
app.use("/api/lander4", require("./routers/lander4/index"));

// ---- Lander5 -----//
app.use("/api/lander5", require("./routers/lander5/index"));

app.use("/api/lander7", require("./routers/lander7/index"));

app.use("/api/phonepe-v2", require("./routers/phonepeV2/index"));

// ---- PayU Payment Gateway ----//
app.use("/api/payu", require("./routers/payU/index"));

// --- lander6 ----//
app.use("/api/lander6", require("./routers/lander6/index"));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
