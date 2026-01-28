const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (!transporter) {
    console.log("SMTP_HOST =", process.env.SMTP_HOST);
    console.log("SMTP_PORT =", process.env.SMTP_PORT);
    console.log("SMTP_USER =", process.env.SMTP_USER);

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // REQUIRED for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
}

exports.sendWorkspaceEmail = async ({
  to,
  companyName,
  companyUrl,
  username,
  password
}) => {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"QCS" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your Workspace Is Ready",
    html: `
      <h3>Welcome to ${companyName}</h3>
      <p>Your workspace setup is complete.</p>

      <p><b>Company URL:</b> ${companyUrl}</p>
      <p><b>Username:</b> ${username}</p>
      <p><b>Temporary Password:</b> ${password}</p>

      <p>Please login and change your password immediately.</p>
    `
  });
};
exports.sendInviteEmail = async ({ to, setupUrl, otp, token }) => {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"QCS" <${process.env.SMTP_USER}>`,
    to,
    subject: "Complete Your Company Setup",
    html: `
      <h3>Company Setup Invitation</h3>

      <p><b>Setup URL:</b></p>
      <a href="${setupUrl}">${setupUrl}</a>

      <p><b>OTP:</b> ${otp}</p>

      <p><b>Invite Token:</b></p>
      <p style="word-break: break-all;">${token}</p>

      <p>This link and OTP will expire as scheduled.</p>
    `
  });
};
