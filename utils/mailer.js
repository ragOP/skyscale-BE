// utils/mailer.js
const nodemailer = require("nodemailer");

let _transporter = null;

function ensureEnv() {
  const required = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_SECURE",
  ];
  const missing = required.filter(
    (k) => !process.env[k] || String(process.env[k]).length === 0
  );
  if (missing.length) {
    const msg = `[mailer] Missing SMTP envs: ${missing.join(
      ", "
    )}. Refusing to create transporter.`;
    console.error(msg);
    throw new Error(msg);
  }
}

function getTransporter() {
  if (_transporter) return _transporter;

  ensureEnv();

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE, // "true" or "false"
  } = process.env;

  _transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE) === "true", // true => 465, false => 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return _transporter;
}

/**
 * Quick SMTP connectivity check (doesn't send mail)
 * @returns {Promise<boolean>}
 */
async function verifySmtp() {
  const t = getTransporter();

  await t.verify(); // throws if cannot connect/auth
  // console.log("[mailer] Verifying SMTP connection...", "Success");
  return true;
}

/**
 * Send an email
 * @param {{
 *   to:string,
 *   subject:string,
 *   html:string,
 *   text?:string,
 *   fromEmail?:string,
 *   fromName?:string,
 *   bcc?:string
 * }} opts
 */
async function sendEmail(opts) {
  const transporter = getTransporter();
  const fromEmail =
    opts.fromEmail || process.env.FROM_EMAIL || "no-reply@example.com";
  const fromName = opts.fromName || process.env.FROM_NAME || "AstraSoul";

  const info = await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text || "",
    bcc: opts.bcc || undefined,
  });

  console.log(
    "[mailer] Email sent:",
    info.messageId,
    "accepted:",
    info.accepted,
    "rejected:",
    info.rejected
  );
  return info;
}

module.exports = { getTransporter, sendEmail, verifySmtp };
