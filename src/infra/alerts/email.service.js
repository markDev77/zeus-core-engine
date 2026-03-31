const nodemailer = require("nodemailer");
const logger = require("../logging/zeus-logger");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE) === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

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
    logger.warning("EMAIL_NOT_CONFIGURED", { shop, type });
    return;
  }

  const subject = `[ZEUS] Auth alert - ${type} - ${shop}`;

  const html = `
    <h2>ZEUS Auth Alert</h2>
    <p><strong>Shop:</strong> ${shop}</p>
    <p><strong>Type:</strong> ${type}</p>
    <p><strong>Code:</strong> ${code || "N/A"}</p>
    <p><strong>Message:</strong> ${message}</p>
    <pre>${JSON.stringify(context, null, 2)}</pre>
  `;

  await transporter.sendMail({
    from,
    to,
    subject,
    html
  });

  logger.info("AUTH_ALERT_EMAIL_SENT", { shop, type, code });
}

module.exports = {
  sendAuthAlertEmail
};
