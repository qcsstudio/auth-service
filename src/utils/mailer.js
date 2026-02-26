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
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
  }
  return transporter;
}

exports.sendAdminWelcomeEmail = async ({
  to,
  companyName,
  companySlug,
  username,
  password
}) => {
  if (!companySlug) {
    throw new Error("companySlug is required to send login URL");
  }

  const transporter = getTransporter();

  const loginUrl = `https://${companySlug}.${process.env.BASE_DOMAIN}/login`;

  await transporter.sendMail({
    from: `"QCS HRMS" <${process.env.SMTP_USER}>`,
    to,
    subject: "Welcome to QCS HRMS – Your Workspace Is Ready 🚀",
    html: `
    <div style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
        <tr>
          <td align="center">

            <table width="600" cellpadding="0" cellspacing="0" 
              style="background:#ffffff;border-radius:10px;overflow:hidden;
              box-shadow:0 8px 20px rgba(0,0,0,0.05);">

              <!-- Header -->
              <tr>
                <td style="background:#0575E6;padding:25px;text-align:center;color:#ffffff;">
                  <h2 style="margin:0;">Welcome to QCS HRMS</h2>
                  <p style="margin:6px 0 0;font-size:14px;">
                    Your digital workspace is successfully created
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:30px;color:#333333;">

                  <h3 style="margin-top:0;">Hello ${companyName} Admin 👋</h3>

                  <p>
                    We are pleased to inform you that your company workspace has been 
                    successfully set up on QCS HRMS.
                    You can now securely manage employees, attendance, payroll, and more —
                    all in one powerful platform.
                  </p>

                  <p><strong>Your Login Details:</strong></p>

                  <div style="background:#f8fafc;padding:15px;border-radius:6px;">
                    <p style="margin:5px 0;"><strong>Login URL:</strong></p>
                    <p style="margin:5px 0;">
                      <a href="${loginUrl}" 
                        style="color:#0575E6;text-decoration:none;font-weight:bold;">
                        ${loginUrl}
                      </a>
                    </p>

                    <p style="margin:5px 0;"><strong>Email:</strong> ${username}</p>
                    <p style="margin:5px 0;"><strong>Temporary Password:</strong> ${password}</p>
                  </div>

                  <div style="text-align:center;margin:25px 0;">
                    <a href="${loginUrl}" 
                      style="background:#0575E6;color:#ffffff;padding:12px 25px;
                      border-radius:5px;text-decoration:none;font-weight:bold;">
                      Login to Your Workspace
                    </a>
                  </div>

                  <p style="font-size:14px;color:#555;">
                    🔒 For security reasons, please log in and change your password immediately.
                  </p>

                  <p style="margin-top:30px;">
                    If you need any assistance, our support team is always ready to help.
                  </p>

                  <p style="margin-top:30px;">
                    Best Regards,<br/>
                    <strong>QCS Team</strong>
                  </p>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f1f5f9;padding:15px;text-align:center;
                  font-size:12px;color:#666;">
                  © ${new Date().getFullYear()} QCS HRMS. All rights reserved.
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>
    </div>
    `
  });
};

exports.sendWorkspaceEmail2 = async ({
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

// exports.sendAdminWelcomeEmail = async ({
//   to,
//   name,
//   companyUrl,
//   tempPassword
// }) => {
//   const transporter = getTransporter();

//   await transporter.sendMail({
//     from: `"QCS" <${process.env.SMTP_USER}>`,
//     to,
//     subject: "Admin Account Created",
//     html: `
//       <h3>Hello ${name}</h3>
//       <p>You have been added as a Company Admin.</p>

//       <p><b>Company URL:</b> ${companyUrl}</p>
//       <p><b>Email:</b> ${to}</p>
//       <p><b>Temporary Password:</b> ${tempPassword}</p>

//       <p>Please login and change your password immediately.</p>
//     `
//   });
// };
exports.sendOTPEmail = async ({ to, otp }) => {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"QCS" <${process.env.SMTP_USER}>`,
    to,
    subject: "Password Reset OTP",
    html: `
      <h3>Password Reset Request</h3>
      <p>Your OTP is:</p>
      <h2>${otp}</h2>
      <p>This OTP will expire in 10 minutes.</p>
    `
  });
};