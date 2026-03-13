const nodemailer = require("nodemailer");

let transporter;

/* ======================================================
   GET SMTP TRANSPORTER
====================================================== */
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
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

/* ======================================================
   SEND ADMIN WELCOME EMAIL
====================================================== */
exports.sendAdminWelcomeEmail = async ({
  to,
  companyName,
  companySlug,
  username,
  password,
}) => {
  try {
    if (!companySlug) {
      throw new Error("companySlug is required to send login URL");
    }

    console.log("📨 Preparing admin welcome email...");
    console.log("Recipient:", to);

    const transporter = getTransporter();

    const loginUrl = `https://${companySlug}.${process.env.BASE_DOMAIN}/login`;

    const info = await transporter.sendMail({
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

                <tr>
                  <td style="background:#0575E6;padding:25px;text-align:center;color:#ffffff;">
                    <h2 style="margin:0;">Welcome to QCS HRMS</h2>
                    <p style="margin:6px 0 0;font-size:14px;">
                      Your digital workspace is successfully created
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:30px;color:#333333;">

                    <h3>Hello ${companyName} Admin 👋</h3>

                    <p>
                      Your company workspace has been successfully created on QCS HRMS.
                    </p>

                    <div style="background:#f8fafc;padding:15px;border-radius:6px;">
                      <p><b>Login URL:</b>
                        <a href="${loginUrl}">${loginUrl}</a>
                      </p>

                      <p><b>Email:</b> ${username}</p>
                      <p><b>Temporary Password:</b> ${password}</p>
                    </div>

                    <div style="text-align:center;margin:25px 0;">
                      <a href="${loginUrl}"
                        style="background:#0575E6;color:#ffffff;padding:12px 25px;
                        border-radius:5px;text-decoration:none;font-weight:bold;">
                        Login to Your Workspace
                      </a>
                    </div>

                    <p style="font-size:14px;color:#555;">
                      Please login and change your password immediately.
                    </p>

                    <p style="margin-top:30px;">
                      Best Regards,<br/>
                      <strong>QCS Team</strong>
                    </p>

                  </td>
                </tr>

                <tr>
                  <td style="background:#f1f5f9;padding:15px;text-align:center;
                    font-size:12px;color:#666;">
                    © ${new Date().getFullYear()} QCS HRMS
                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>
      </div>
      `,
    });

    console.log("✅ Email sent successfully");
    console.log("📨 Message ID:", info.messageId);
    console.log("📡 SMTP response:", info.response);
  } catch (error) {
    console.error("❌ Email sending failed");
    console.error(error);
  }
};

/* ======================================================
   SEND WORKSPACE EMAIL
====================================================== */
exports.sendWorkspaceEmail = async ({
  to,
  companyName,
  companySlug,
  username,
  password,
}) => {
  try {
    const transporter = getTransporter();

    const loginUrl = `https://qcshrms.vercel.app/`;

    const info = await transporter.sendMail({
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
      `,
    });

    console.log("✅ Workspace email sent:", info.messageId);
  } catch (error) {
    console.error("❌ Workspace email failed");
    console.error(error);
  }
};

/* ======================================================
   SEND COMPANY INVITE EMAIL
====================================================== */
exports.sendInviteEmail = async ({
  to,
  setupUrl,
  otp,
  companyName,
  invitedBy,
}) => {
  try {
    const transporter = getTransporter();
    const inviteLink = setupUrl;

    const info = await transporter.sendMail({
      from: `"QCS HRMS" <${process.env.SMTP_USER}>`,
      to,
      subject: `You're invited to set up ${
        companyName || "your company"
      } on QCS HRMS`,
      html: `
      <div style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:40px auto;background:#fff;
          border-radius:10px;box-shadow:0 10px 25px rgba(0,0,0,0.08);overflow:hidden;">

          <div style="background:#0575E6;padding:25px;text-align:center;color:#fff;">
            <h2>QCS HRMS</h2>
            <p>Secure Company Setup Invitation</p>
          </div>

          <div style="padding:30px;color:#333;line-height:1.6;">
            <h3>You're invited to set up your company</h3>

            <p>
              You have been invited 
              ${invitedBy ? `by <strong>${invitedBy}</strong>` : ""}
              to configure <strong>${companyName || "your company"}</strong>.
            </p>

            <div style="text-align:center;margin:25px 0;">
              <a href="${inviteLink}"
                style="background:#0575E6;color:#fff;padding:12px 24px;
                border-radius:6px;text-decoration:none;font-weight:bold;">
                Complete Company Setup
              </a>
            </div>

            <div style="background:#f8fafc;border:1px solid #E2E8F0;
                padding:15px;border-radius:6px;text-align:center;">
              <p>Your One-Time Verification Code</p>
              <h2 style="color:#0575E6;letter-spacing:3px;">
                ${otp}
              </h2>
            </div>

            <p style="font-size:13px;color:#666;margin-top:20px;">
              This invitation link will expire in 24 hours.
            </p>

            <p style="font-size:13px;">
              <a href="${inviteLink}">${inviteLink}</a>
            </p>

            <hr>

            <p style="font-size:12px;color:#777;">
              If you did not expect this invitation, you can ignore this email.
            </p>
          </div>

          <div style="background:#f8fafc;padding:15px;text-align:center;font-size:12px;color:#888;">
            © ${new Date().getFullYear()} QCS HRMS
          </div>
        </div>
      </div>
      `,
    });

    console.log("✅ Invite email sent:", info.messageId);
  } catch (error) {
    console.error("❌ Invite email failed");
    console.error(error);
  }
};

/* ======================================================
   SEND PASSWORD RESET OTP
====================================================== */
exports.sendOTPEmail = async ({ to, otp }) => {
  try {
    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: `"QCS" <${process.env.SMTP_USER}>`,
      to,
      subject: "Password Reset OTP",
      html: `
        <h3>Password Reset Request</h3>
        <p>Your OTP is:</p>
        <h2>${otp}</h2>
        <p>This OTP will expire in 10 minutes.</p>
      `,
    });

    console.log("✅ OTP email sent:", info.messageId);
  } catch (error) {
    console.error("❌ OTP email failed");
    console.error(error);
  }
};