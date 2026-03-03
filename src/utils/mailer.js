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
exports.sendInviteEmail = async ({
  to,
  setupUrl,
  otp,
  companyName,
  invitedBy
}) => {

  const transporter = getTransporter();

  // ✅ DO NOT APPEND TOKEN AGAIN
  const inviteLink = setupUrl;

  await transporter.sendMail({
    from: `"QCS HRMS" <${process.env.SMTP_USER}>`,
    to,
    subject: `You're invited to set up ${companyName || "your company"} on QCS HRMS`,
    html: `
    <div style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
        <tr>
          <td align="center">

            <table width="600" cellpadding="0" cellspacing="0"
              style="background:#ffffff;border-radius:12px;
              box-shadow:0 10px 25px rgba(0,0,0,0.08);overflow:hidden;">

              <!-- Header -->
              <tr>
                <td style="background:#0575E6;padding:30px;text-align:center;color:#ffffff;">
                  <h1 style="margin:0;font-size:22px;">QCS HRMS</h1>
                  <p style="margin:5px 0 0;font-size:14px;opacity:0.9;">
                    Secure Company Setup Invitation
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:35px;color:#333;line-height:1.6;">

                  <h2 style="margin-top:0;font-size:20px;">
                    You're invited to set up your company
                  </h2>

                  <p>
                    You have been invited ${invitedBy ? `by <strong>${invitedBy}</strong>` : ""}
                    to configure <strong>${companyName || "your company"}</strong> on QCS HRMS.
                  </p>

                  <p>
                    Click the button below to securely complete your company setup.
                  </p>

                  <!-- CTA Button -->
                  <div style="text-align:center;margin:30px 0;">
                    <a href="${inviteLink}"
                      style="background:#0575E6;color:#ffffff;
                      padding:14px 28px;
                      font-size:16px;
                      border-radius:6px;
                      text-decoration:none;
                      font-weight:600;
                      display:inline-block;">
                      Complete Company Setup
                    </a>
                  </div>

                  <!-- OTP -->
                  <div style="background:#f8fafc;
                      border:1px solid #E2E8F0;
                      padding:15px;
                      border-radius:6px;
                      text-align:center;
                      margin:20px 0;">

                      <p style="margin:0;font-size:14px;color:#555;">
                        Your One-Time Verification Code
                      </p>

                      <p style="margin:10px 0;font-size:24px;
                          font-weight:bold;
                          letter-spacing:3px;
                          color:#0575E6;">
                        ${otp}
                      </p>
                  </div>

                  <p style="font-size:13px;color:#666;">
                    This invitation link will expire in 24 hours for security reasons.
                  </p>

                  <p style="font-size:13px;word-break:break-all;">
                    <a href="${inviteLink}" style="color:#0575E6;">
                      ${inviteLink}
                    </a>
                  </p>

                  <hr style="border:none;border-top:1px solid #eee;margin:25px 0;">

                  <p style="font-size:13px;color:#777;">
                    If you did not expect this invitation, you can safely ignore this email.
                  </p>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f8fafc;
                  padding:20px;
                  text-align:center;
                  font-size:12px;
                  color:#888;">

                  © ${new Date().getFullYear()} QCS HRMS<br>
                  Secure HR Management Platform

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