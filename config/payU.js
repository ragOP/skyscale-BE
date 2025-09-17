const PayU = require("payu-websdk");

const payuClient = new PayU({
  key: process.env.PAYU_MERCHANT_KEY,
  salt: process.env.PAYU_MERCHANT_SALT,
}, process.env.PAYU_ENV || "TEST");

module.exports = payuClient;
