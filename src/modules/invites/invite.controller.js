
const crypto = require("crypto"); // ✅ Add this at the very top

const Invite = require("./invite.model");
const { sendInviteEmail } = require("../../utils/mailer");
const CompanyService = require("../companies/company.service"); // ✅ IMPORT SERVICE
const User = require("../users/user.model"); // For creating admin

exports.sendSetupLink = async (req, res) => {
  try {
    const { email, role, trial, linkExpiry } = req.body;

    if (!email || !linkExpiry) {
      return res.status(400).json({ message: "email and expiry required" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const invite = await Invite.create({
      email,
      role: role || "COMPANY_ADMIN",
      trial: !!trial,
      expiresAt: new Date(linkExpiry),
      token,
      otp
    });

    const setupUrl = `https://qcshrms.vercel.app/org-setup`;

    // ✅ send ALL THREE in email
    await sendInviteEmail({
      to: email,
      setupUrl,
      otp,
      token
    });

    res.json({
      message: "setup link sent"
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

 

exports.validateOtp = async (req, res) => {
  try {
    const { token, otp } = req.body;

    const invite = await Invite.findOne({ token, used: false });
    if (!invite) return res.status(400).json({ message: "Invalid invite" });

    if (invite.expiresAt < new Date())
      return res.status(400).json({ message: "Invite expired" });

    if (invite.otpVerified)
      return res.status(400).json({ message: "OTP already verified" });

    if (invite.otp !== otp)
      return res.status(400).json({ message: "Incorrect OTP" });

    invite.otpVerified = true;
    await invite.save();

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};



/* ======================================================
   3️⃣ CREATE COMPANY (SAME PAYLOAD AS SUPER ADMIN)
====================================================== */
exports.createCompanyFromInvite = async (req, res) => {
  try {
    const invite = req.invite;

    if (!invite.otpVerified)
      return res.status(403).json({ message: "OTP not verified" });

    // 🔁 SAME payload as super admin
    const companyPayload = {
      name: req.body.companyName,
      slug: req.body.slug,
      customUrl: req.body.customUrl,
      industryType: req.body.industryType,
      country: req.body.country,
      timezone: req.body.timezone,
      currency: req.body.currency
    };

    const company = await CompanyService.createCompany(companyPayload);

    invite.companyId = company._id;
    await invite.save();

    res.status(201).json({
      message: "company created",
      companyId: company._id
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   4️⃣ CREATE ADMIN (SAME PAYLOAD AS SUPER ADMIN)
====================================================== */
exports.createAdminFromInvite = async (req, res) => {
  try {
    const invite = req.invite;
    if (!invite.companyId)
      return res.status(400).json({ message: "Company not created yet" });

    // SAME payload as super admin (+ password)
    const adminPayload = {
      fullName: req.body.fullName,
      email: req.body.email,
      contact: req.body.contact,
      role: req.body.role,
      password: req.body.password
    };

    const result = await CompanyService.createCompanyAdmin(
      invite.companyId,
      adminPayload
    );

    res.status(201).json({
      message: "admin created",
      adminId: result.admin._id
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   5️⃣ SETUP WORKSPACE (SAME PAYLOAD AS SUPER ADMIN)
====================================================== */
exports.setupWorkspaceFromInvite = async (req, res) => {
  try {
    const invite = req.invite;
    if (!invite.companyId)
      return res.status(400).json({ message: "Company not created yet" });

    const company = await CompanyService.setupWorkspace(
      invite.companyId,
      req.body
    );

    // mark invite used after final step
    invite.used = true;
    await invite.save();

    res.json({
      message: "workspace setup completed",
      companyId: company._id,
      companyUrl: company.workspace.companyUrl
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
