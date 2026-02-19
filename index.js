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
app.use("/api/payment2", require("./routers/payment2/index"));

// ------ Astra Soul -----//
app.use("/api/lander1", require("./routers/lander1/index"));

// ------ Astra Love -----//
app.use("/api/lander2", require("./routers/lander2/index"));

// ----- SoulMate -----//
app.use("/api/lander3", require("./routers/lander3/index"));

// ----- Lander69 (Razorpay Live) -----//
app.use("/api/lander69", require("./routers/lander69/index"));

// ---- Signature -----//
app.use("/api/lander4", require("./routers/lander4/index"));

// ---- Lander5 -----//
app.use("/api/lander5", require("./routers/lander5/index"));

app.use("/api/lander7", require("./routers/lander7/index"));
app.use("/api/lander777", require("./routers/lander777/index"));

app.use("/api/phonepe-v2", require("./routers/phonepeV2/index"));

// ---- PayU Payment Gateway ----//
app.use("/api/payu", require("./routers/payU/index"));

// --- lander6 ----//
app.use("/api/lander6", require("./routers/lander6/index"));

//--landerMain -----//
app.use("/api/landerMain", require("./routers/landerMain/index"));

//------jelly-belly-----//
app.use("/api/lander8", require("./routers/lander8/index"));

app.use("/api/case", require("./routers/case/index"));

// ---------------- Auth Router ------------------//
app.use("/api/auth", require("./routers/auth/index"));

app.use("/api/lander11", require("./routers/lander11/index"));

app.use("/api/lander12", require("./routers/lander12/index"));
app.use("/api/lander13", require("./routers/lander13/index"));
app.use("/api/lander21", require("./routers/lander21/index"));
  app.use("/api/lander31", require("./routers/lander31/index"));
  app.use("/api/lander993", require("./routers/lander993/index"));

  app.use("/api/lander111", require("./routers/lander111/index"));

app.use("/api/log", require("./routers/log/index"));
app.use("/api/log2", require("./routers/log-new/index"));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
