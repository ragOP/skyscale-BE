// routes/payment.js
const express = require("express");
const payuClient = require("../../config/payU");
const router = express.Router();

router.get("/pay", async (req, res) => {
  try {
    const { 
      amount, 
      productinfo,
      name,
      email,
      phone,
      dateOfBirth,
      gender,
      placeOfBirth,
      additionalProducts = [],
    } = req.query;

    const txnid = "TXN" + Date.now();

    const paymentParams = {
      txnid,
      amount,
      productinfo,
      firstname: name,
      phone: phone,
      email: email,
      surl: `https://skyscale-be.onrender.com/api/lander3/success?txnid=${txnid}&email=${email}&phone=${phone}`,
      furl: `https://skyscale-be.onrender.com/api/lander3/success?txnid=${txnid}&email=${email}&phone=${phone}`,
      udf1: dateOfBirth,
      udf2: gender,
      udf3: placeOfBirth,
      udf4: additionalProducts,
    };

    const result = await payuClient.paymentInitiate(paymentParams);
    return res.send(result);
  } catch (err) {
    console.error("PayU pay error:", err);
    res.status(500).json({ success: false, message: "Payment init failed" });
  }
});

router.get("/pay-sister", async (req, res) => {
  try {
    const { 
      amount, 
      productinfo,
      name,
      email,
      phone,
      dateOfBirth,
      gender,
      placeOfBirth,
      additionalProducts = [],
    } = req.query;

    const txnid = "TXN" + Date.now();

    const paymentParams = {
      txnid,
      amount,
      productinfo,
      firstname: name,
      phone: phone,
      email: email,
      surl: `http://localhost:9005/api/lander5/success?txnid=${txnid}&email=${email}&phone=${phone}`,
      furl: `http://localhost:9005/api/lander5/success?txnid=${txnid}&email=${email}&phone=${phone}`,
      udf1: dateOfBirth,
      udf2: gender,
      udf3: placeOfBirth,
      udf4: additionalProducts,
    };

    const result = await payuClient.paymentInitiate(paymentParams);
    return res.send(result);
  } catch (err) {
    console.error("PayU pay error:", err);
    res.status(500).json({ success: false, message: "Payment init failed" });
  }
});

module.exports = router;
