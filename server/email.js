const sgMail = require('@sendgrid/mail');
const config = require('./config');

function getSendGrid() {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey || apiKey === 'your_sendgrid_api_key_here') return null;
  sgMail.setApiKey(apiKey);
  return sgMail;
}

const FROM = () => process.env.SENDGRID_FROM_EMAIL || '';

function baseTemplate({ title, preheader, bodyHtml }) {
  const appUrl = config.APP_URL;
  return `<!DOCTYPE html>
<html lang="gu">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#FDF6E3;font-family:Georgia,serif;">
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDF6E3;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4A0E0E 0%,#6B1A1A 60%,#8B2500 100%);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
            <img src="${appUrl}${config.LOGO_PATH}" alt="${config.ORG_NAME}" width="80" height="80"
              style="object-fit:contain;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;" />
            <p style="margin:0 0 4px;color:#D4A017;font-size:13px;letter-spacing:2px;text-transform:uppercase;">${config.ORG_NAME_HI} आयोजित</p>
            <h1 style="margin:0;color:#F0C842;font-size:26px;letter-spacing:1px;">${config.BRAND_NAME_HI}</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#FFFEF9;padding:36px 40px;border-left:1px solid rgba(212,160,23,0.2);border-right:1px solid rgba(212,160,23,0.2);">
            ${bodyHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:linear-gradient(135deg,#4A0E0E 0%,#6B1A1A 100%);border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:rgba(253,246,227,0.6);font-size:12px;">
              © ${config.YEAR} ${config.ORG_NAME} · ${config.BRAND_NAME}<br />
              <a href="${appUrl}" style="color:#D4A017;text-decoration:none;">${appUrl}</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(url, label) {
  return `<div style="text-align:center;margin:28px 0;">
    <a href="${url}" style="display:inline-block;background:#D4A017;color:#2C1810;font-weight:700;font-size:15px;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">${label}</a>
  </div>`;
}

function h2(text) {
  return `<h2 style="margin:0 0 20px;color:#4A0E0E;font-size:22px;border-bottom:2px solid rgba(212,160,23,0.3);padding-bottom:12px;">${text}</h2>`;
}

function p(text, style = '') {
  return `<p style="margin:0 0 16px;color:#2C1810;font-size:15px;line-height:1.7;${style}">${text}</p>`;
}

// ── Welcome email ──────────────────────────────────────────────
async function sendWelcomeEmail(user) {
  const sg = getSendGrid();
  if (!sg) return;
  const appUrl = config.APP_URL;

  const bodyHtml = `
    ${h2(`Welcome, ${user.name}! 🙏`)}
    ${p(`You have successfully registered for <strong>${config.BRAND_NAME}</strong> — the spiritual points challenge organized by ${config.ORG_NAME}.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDF6E3;border:1px solid rgba(212,160,23,0.35);border-radius:10px;padding:4px;margin-bottom:20px;">
      <tr><td style="padding:14px 18px;">
        <p style="margin:0 0 8px;font-size:13px;color:#5C3820;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Your Account Details</p>
        <table cellpadding="0" cellspacing="0">
          <tr><td style="color:#5C3820;font-size:14px;padding:3px 0;width:100px;">Name</td><td style="color:#2C1810;font-size:14px;font-weight:600;">${user.name}</td></tr>
          <tr><td style="color:#5C3820;font-size:14px;padding:3px 0;">Email</td><td style="color:#2C1810;font-size:14px;font-weight:600;">${user.email}</td></tr>
          <tr><td style="color:#5C3820;font-size:14px;padding:3px 0;">Phone</td><td style="color:#2C1810;font-size:14px;font-weight:600;">${user.phone || '—'}</td></tr>
        </table>
      </td></tr>
    </table>
    ${p(`The competition runs from <strong>${config.COMPETITION_START_DISPLAY}</strong> to <strong>${config.COMPETITION_END_DISPLAY}</strong>. Log your daily spiritual activities and climb the leaderboard!`)}
    ${p(`<strong>Don't forget:</strong> Pay the ${config.REGISTRATION_FEE_DISPLAY} registration fee to have your points counted.`, 'color:#6B1A1A;background:#FDF6E3;border-left:3px solid #D4A017;padding:10px 14px;border-radius:0 6px 6px 0;')}
    ${btn(appUrl + '/dashboard', 'Open My Dashboard')}
    ${p('Jai Jinendra 🙏', 'text-align:center;color:#5C3820;font-style:italic;')}
  `;

  try {
    await sg.send({
      to: user.email,
      from: FROM(),
      subject: `Welcome to ${config.BRAND_NAME}, ${user.name}! 🙏`,
      html: baseTemplate({
        title: `Welcome to ${config.BRAND_NAME}`,
        preheader: `Welcome ${user.name}! Your ${config.BRAND_NAME} account is ready.`,
        bodyHtml,
      }),
    });
    console.log(`[Email] Welcome sent to ${user.email}`);
  } catch (err) {
    console.error('[Email] Welcome failed:', err.response?.body?.errors || err.message);
  }
}

// ── Password reset email ───────────────────────────────────────
async function sendPasswordResetEmail(user, token) {
  const sg = getSendGrid();
  if (!sg) return;
  const appUrl = config.APP_URL;
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  const bodyHtml = `
    ${h2('Password Reset Request')}
    ${p(`Hi <strong>${user.name}</strong>,`)}
    ${p(`We received a request to reset your ${config.BRAND_NAME} account password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.`)}
    ${btn(resetUrl, 'Reset My Password')}
    ${p('If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.', 'font-size:13px;color:#5C3820;text-align:center;')}
    <hr style="border:none;border-top:1px solid rgba(212,160,23,0.25);margin:24px 0;" />
    ${p('Or copy and paste this link into your browser:', 'font-size:12px;color:#5C3820;')}
    <p style="word-break:break-all;font-size:12px;color:#D4A017;margin:0 0 16px;">${resetUrl}</p>
  `;

  try {
    await sg.send({
      to: user.email,
      from: FROM(),
      subject: `Reset your ${config.BRAND_NAME} password`,
      html: baseTemplate({
        title: `Password Reset — ${config.BRAND_NAME}`,
        preheader: `Reset your ${config.BRAND_NAME} password. Link expires in 1 hour.`,
        bodyHtml,
      }),
    });
    console.log(`[Email] Password reset sent to ${user.email}`);
  } catch (err) {
    console.error('[Email] Password reset failed:', err.response?.body?.errors || err.message);
  }
}

module.exports = { sendWelcomeEmail, sendPasswordResetEmail };
