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

  console.log(process.env.BASE_DOMAIN)

  await transporter.sendMail({
    from: `"QCS" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your Workspace Is Ready",
    html: `
      <h3>Welcome to ${companyName}</h3>

      <p>
        <b>Login URL:</b><br/>
        <a href="${loginUrl}">${loginUrl}</a>
      </p>

      <p><b>Email:</b> ${username}</p>
      <p><b>Temporary Password:</b> ${password}</p>

      <p>Please login and change your password immediately.</p>
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
    from: `"QCS HRMS" <${process.env.SMTP_USER}>`,
    to,
    subject: "Company Setup Invitation",
    html: `
    <div style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0"
              style="background:#ffffff;border-radius:10px;overflow:hidden;
              box-shadow:0 8px 20px rgba(0,0,0,0.05);">

              <tr>
                <td style="background:#0575E6;padding:25px;text-align:center;color:#ffffff;">
                  <h2 style="margin:0;">Company Setup Invitation</h2>
                </td>
              </tr>

              <tr>
                <td style="padding:30px;color:#333333;">
                  <p>Your company setup link is ready. Please use the details below to proceed.</p>

                  <div style="background:#f8fafc;padding:15px;border-radius:6px;">
                    <p style="margin:5px 0;"><strong>Setup Link:</strong></p>
                    <p style="margin:5px 0;">
                      <a href="${oneLineUrl}"
                        style="color:#0575E6;text-decoration:none;font-weight:bold;">
                        ${oneLineUrl}
                      </a>
                    </p>

                    <p style="margin:5px 0;"><strong>OTP:</strong> ${otp}</p>
                  </div>

                  <div style="text-align:center;margin:25px 0;">
                    <a href="${oneLineUrl}"
                      style="background:#0575E6;color:#ffffff;padding:12px 25px;
                      border-radius:5px;text-decoration:none;font-weight:bold;">
                      Complete Setup
                    </a>
                  </div>
                </td>
              </tr>

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
