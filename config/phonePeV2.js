// config/phonepeV2.js
const qs = require("querystring");
const axios = require("axios");

const CFG = {
  env: process.env.PHONEPE_ENV || "prod",
  authUrl:
    process.env.PHONEPE_AUTH_PROD ||
    "https://api.phonepe.com/apis/identity-manager/v1/oauth/token",
  payUrl:
    process.env.PHONEPE_PAY_PROD ||
    "https://api.phonepe.com/apis/pg/checkout/v2/pay",
  statusBase:
    process.env.PHONEPE_STATUS_PROD ||
    "https://api.phonepe.com/apis/pg/checkout/v2/order",
  clientId: process.env.PHONEPE_CLIENT_ID,
  clientVersion: process.env.PHONEPE_CLIENT_VERSION || "1",
  clientSecret: process.env.PHONEPE_CLIENT_SECRET,
};

if (!CFG.clientId || !CFG.clientSecret) {
  console.warn("[PhonePe v2] Missing CLIENT_ID/CLIENT_SECRET — check .env");
}

// In-memory token cache (keep simple; you can switch to Redis later)
let tokenCache = {
  accessToken: null,
  expiresAt: 0, // epoch seconds
};

function isTokenValid() {
  const now = Math.floor(Date.now() / 1000);
  // refresh 60s early
  return (
    tokenCache.accessToken &&
    tokenCache.expiresAt &&
    tokenCache.expiresAt - 60 > now
  );
}

/** Get O-Bearer token (auth) */
async function getAuthToken() {
  if (isTokenValid()) return tokenCache.accessToken;

  const body = qs.stringify({
    client_id: CFG.clientId,
    client_version: CFG.clientVersion,
    client_secret: CFG.clientSecret,
    grant_type: "client_credentials",
  });

  const res = await axios.post(CFG.authUrl, body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 15000,
  });

  const data = res.data || {};
  const token = data.access_token;
  const expiresAt = data.expires_at || Math.floor(Date.now() / 1000) + 30 * 60; // fallback 30 mins

  if (!token) throw new Error("No access_token from PhonePe");

  tokenCache = { accessToken: token, expiresAt };
  return token;
}

module.exports = {
  CFG,
  getAuthToken,
};
