
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

    // 👇 ONLY org-setup URL
    const setupUrl = `https://qcshrms.vercel.app/org-setup`;

    await sendInviteEmail({
      to: email,
      setupUrl,
      otp
    });

    // 👇 token sent ONLY in response
    res.json({
      message: "setup link sent",
      token,
      inviteId: invite._id
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



exports.createCompanyFromInvite = async (req, res) => {
  try {
    const { company } = req.body;
    const invite = req.invite; // from middleware

    if (!company || !company.name || !company.slug) {
      return res.status(400).json({ message: "company name and slug required" });
    }

    // create company
    const createdCompany = await CompanyService.createCompany(company);

    // attach companyId to invite
    invite.companyId = createdCompany._id;
    await invite.save();

    res.status(201).json({
      message: "company created",
      companyId: createdCompany._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};



exports.createAdminFromInvite = async (req, res) => {
  try {
    const { fullName, email, contact, role, password } = req.body;
    const invite = req.invite;

    if (!invite.companyId) return res.status(400).json({ message: "Company not created yet" });

    if (!fullName || !email || !role || !password) {
      return res.status(400).json({ message: "fullName, email, role and password required" });
    }

    const adminData = { fullName, email, contact, role, password };

    const result = await CompanyService.createCompanyAdmin(invite.companyId, adminData);

    res.status(201).json({
      message: "admin created",
      adminId: result.admin._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


exports.setupWorkspaceFromInvite = async (req, res) => {
  try {
    const workspaceData = req.body;
    const invite = req.invite;

    if (!invite.companyId) return res.status(400).json({ message: "Company not created yet" });

    const company = await CompanyService.setupWorkspace(invite.companyId, workspaceData);

    // mark invite as used
    invite.used = true;
    await invite.save();

    res.status(200).json({
      message: "workspace setup completed",
      companyId: company._id,
      companyUrl: company.workspace.companyUrl
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
