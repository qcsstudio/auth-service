const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

exports.sendWorkspaceEmail = async ({
  to,
  companyName,
  companyUrl,
  username,
  password
}) => {
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
