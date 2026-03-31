"use strict";

const nodemailer = require("nodemailer");
const logger = require("../logging/zeus-logger");

// ==========================
// TRANSPORT (GMAIL)
// ==========================
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    logger.warning("SMTP_NOT_CONFIGURED", { user: !!user, pass: !!pass });
    return null;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass
    }
  });

  return transporter;
}

// ==========================
// SEND EMAIL (SAFE)
// ==========================
async function sendAuthAlertEmail({
  shop,
  type,
  message,
  code,
  context = {}
}) {
  const to = process.env.ALERT_EMAIL_TO;
  const from = process.env.ALERT_EMAIL_FROM;

  if (!to || !from) {
    logger.warning("EMAIL_NOT_CONFIGURED", { shop, type, code });
    return { ok: false, skipped: true };
  }

  const transport = getTransporter();

  if (!transport) {
    logger.warning("SMTP_TRANSPORT_UNAVAILABLE", { shop, type, code });
    return { ok: false, skipped: true };
  }

  const subject = `[ZEUS][AUTH] ${type} - ${shop}`;

  const html = `
    <h2>ZEUS Auth Alert</h2>
    <p><strong>Shop:</strong> ${shop}</p>
    <p><strong>Type:</strong> ${type}</p>
    <p><strong>Code:</strong> ${code || "N/A"}</p>
    <p><strong>Message:</strong> ${message || "N/A"}</p>
    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    <pre>${JSON.stringify(context, null, 2)}</pre>
  `;

  try {
    await transport.sendMail({
      from,
      to,
      subject,
      html
    });

    logger.info("AUTH_EMAIL_SENT", { shop, type, code });

    return { ok: true };
  } catch (err) {
    logger.error("AUTH_EMAIL_FAILED", {
      shop,
      type,
      code,
      error: err.message
    });

    return { ok: false, error: err.message };
  }
}

module.exports = {
  sendAuthAlertEmail
};
