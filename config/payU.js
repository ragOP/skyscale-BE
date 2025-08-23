// config/payU.js
const PayU = require("payu-websdk");

// Force TEST environment by setting environment variables
process.env.PAYU_ENV = "TEST";
process.env.NODE_ENV = "test";

// Initialize PayU client with explicit test environment
const payuClient = new PayU({
  key: process.env.PAYU_MERCHANT_KEY,
  salt: process.env.PAYU_MERCHANT_SALT,
  environment: "TEST", // Add explicit environment setting
}, "TEST"); // Force TEST environment for development

// Validate configuration
if (!process.env.PAYU_MERCHANT_KEY || !process.env.PAYU_MERCHANT_SALT) {
  console.warn("[PayU] Missing MERCHANT_KEY/MERCHANT_SALT — check .env");
}

// Log environment for debugging
console.log("[PayU] Environment:", process.env.PAYU_ENV || "TEST");
console.log("[PayU] Using TEST environment for development");

module.exports = {
  payuClient,
  CFG: {
    env: "TEST", // Force test environment
    merchantKey: process.env.PAYU_MERCHANT_KEY,
    merchantSalt: process.env.PAYU_MERCHANT_SALT,
    // Test URLs
    testUrls: {
      baseUrl: "https://test.payu.in",
      payUrl: "https://test.payu.in/_payment",
      processUrl: "https://test.payu.in/process"
    }
  }
};     // Possible value  = TEST/LIVE


