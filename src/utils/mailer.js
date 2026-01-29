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
  companySlug,
  username,
  password
}) => {
  const transporter = getTransporter();

  const loginUrl = `https://qcshrms.vercel.app/`;

  await transporter.sendMail({
    from: `"QCS" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your Workspace Is Ready",
    html: `
      <h3>Welcome to ${companyName}</h3>
      <p>Your workspace setup is complete.</p>

      <p><b>Login URL:</b> <a href="${loginUrl}">${loginUrl}</a></p>
      <p><b>Company Code:</b> ${companySlug}</p>

      <p><b>Email:</b> ${username}</p>
      <p><b>Temporary Password:</b> ${password}</p>

      <p>Please login and change your password immediately.</p>
    `
  });
};



exports.sendInviteEmail = async ({ to, setupUrl, otp, token }) => {
  const transporter = getTransporter();

  const oneLineUrl = `${setupUrl}?token=${token}`;

  await transporter.sendMail({
    from: `"QCS" <${process.env.SMTP_USER}>`,
    to,
    subject: "Company Setup Invitation",
    html: `
      <p>
        <b>Setup Link:</b><br/>
        <a href="${oneLineUrl}">${oneLineUrl}</a>
      </p>

      <p><b>OTP:</b> ${otp}</p>
    `
  });
};

exports.sendAdminWelcomeEmail = async ({
  to,
  name,
  companyUrl,
  tempPassword
}) => {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"QCS" <${process.env.SMTP_USER}>`,
    to,
    subject: "Admin Account Created",
    html: `
      <h3>Hello ${name}</h3>
      <p>You have been added as a Company Admin.</p>

      <p><b>Company URL:</b> ${companyUrl}</p>
      <p><b>Email:</b> ${to}</p>
      <p><b>Temporary Password:</b> ${tempPassword}</p>

      <p>Please login and change your password immediately.</p>
    `
  });
};
