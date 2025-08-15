// utils/mailer-resend.js
const { Resend } = require("resend");

let _client = null;

function getClient() {
  if (_client) return _client;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    const msg = "[resend] RESEND_API_KEY missing";
    console.error(msg);
    throw new Error(msg);
  }
  _client = new Resend(key);
  return _client;
}

/**
 * Send HTML email via Resend
 * @param {{
 *   to: string | string[],
 *   subject: string,
 *   html: string,
 *   fromEmail?: string,
 *   fromName?: string,
 *   bcc?: string | string[],
 *   replyTo?: string | string[],
 *   tags?: Array<{name: string, value: string}>
 * }} opts
 * @returns {Promise<{id?: string}>}  // id present => queued/accepted
 */
async function sendEmailResend(opts) {
  const resend = getClient();
  const fromEmail = opts.fromEmail || process.env.FROM_EMAIL || "no-reply@example.com";
  const fromName = opts.fromName || process.env.FROM_NAME || "AstraSoul";

  const from = `${fromName} <${fromEmail}>`;

  const payload = {
    from,
    to: Array.isArray(opts.to) ? opts.to : [opts.to],
    subject: opts.subject,
    html: opts.html,
    ...(opts.bcc ? { bcc: Array.isArray(opts.bcc) ? opts.bcc : [opts.bcc] } : {}),
    ...(opts.replyTo ? { reply_to: Array.isArray(opts.replyTo) ? opts.replyTo : [opts.replyTo] } : {}),
    ...(opts.tags ? { tags: opts.tags } : {}),
  };

  const { data, error } = await resend.emails.send(payload);

  if (error) {
    // Normalize to throw (caller logs into EmailLog)
    const message = error?.message || "Resend send error";
    const code = error?.name || error?.code || "RESEND_ERROR";
    const err = new Error(message);
    err.code = code;
    throw err;
  }

  return { id: data?.id };
}

module.exports = { sendEmailResend };
