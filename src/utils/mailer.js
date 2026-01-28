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

exports.sendInviteEmail = async ({ to, setupUrl, otp }) => {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"QCS" <${process.env.SMTP_USER}>`,
    to,
    subject: "Complete Your Company Setup",
    html: `
      <h3>You are invited to setup your workspace</h3>
      <p>Your OTP: <b>${otp}</b></p>
      <p>Click the link below to continue:</p>
      <a href="${setupUrl}">${setupUrl}</a>
      <p>This link will expire.</p>
    `
  });
};


exports.sendAdminWelcomeEmail = async ({ to, name, companyUrl, tempPassword }) => {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"QCS" <${process.env.SMTP_USER}>`,
    to,
    subject: "Welcome to Your Company",
    html: `
      <h3>Hello ${name}</h3>
      <p>You have been added as an admin to your company.</p>

      <p><b>Company URL:</b> ${companyUrl}</p>
      <p><b>Temporary Password:</b> ${tempPassword}</p>

      <p>Please login and change your password immediately.</p>
    `
  });
};
