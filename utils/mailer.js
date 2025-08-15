// utils/mailer.js
const nodemailer = require("nodemailer");

let _transporter = null;

/**
 * Create or reuse a single SMTP transporter
 */
function getTransporter() {
  if (_transporter) return _transporter;

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE, // "true" or "false"
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn("[mailer] Missing SMTP env vars. Email will fail until configured.");
  }

  _transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: String(SMTP_SECURE || "false") === "true", // true for 465
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return _transporter;
}

/**
 * Generic email sender (HTML + optional text)
 * @param {{to:string, subject:string, html:string, text?:string, fromEmail?:string, fromName?:string}} opts
 */
async function sendEmail(opts) {
  const transporter = getTransporter();
  const fromEmail = opts.fromEmail || process.env.FROM_EMAIL || "no-reply@example.com";
  const fromName = opts.fromName || process.env.FROM_NAME || "AstraSoul";

  const info = await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text || "",
  });

  return info;
}

module.exports = {
  getTransporter,
  sendEmail,
};
