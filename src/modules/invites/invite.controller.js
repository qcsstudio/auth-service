
const crypto = require("crypto"); // ✅ Add this at the very top
const Company = require("../companies/company.model");
const Invite = require("./invite.model");
const { sendInviteEmail } = require("../../utils/mailer");
const CompanyService = require("../companies/company.service"); // ✅ IMPORT SERVICE
const User = require("../users/user.model"); // For creating admin

/* ======================================================
   1️⃣ SEND SETUP LINK
====================================================== */

exports.sendSetupLink = async (req, res) => {
  try {
    const { email, role, trial, linkExpiry } = req.body;

    if (!email || !linkExpiry) {
      return res.status(400).json({ message: "email and linkExpiry required" });
    }

    const expiryTime = new Date(linkExpiry);
    if (isNaN(expiryTime.getTime())) {
      return res.status(400).json({ message: "Invalid linkExpiry format" });
    }

    // Remove old unused invites
    await Invite.deleteMany({
      email,
      used: false
    });

    const token = crypto.randomBytes(32).toString("hex");
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const invite = await Invite.create({
      email,
      role: role || "COMPANY_ADMIN",
      trial: !!trial,
      expiresAt: expiryTime,
      token,
      otp,
      otpVerified: false,
      used: false
    });

    // ✅ TOKEN ADDED ONLY HERE
    const setupUrl = `https://www.qcsstudios.com/org-setup?token=${token}`;

    await sendInviteEmail({
      to: email,
      setupUrl,
      otp,
      companyName: "QCS HRMS",
      invitedBy: "Super Admin"
    });

    res.status(200).json({
      message: "Setup link sent successfully"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   2️⃣ VALIDATE OTP
====================================================== */
exports.validateOtp = async (req, res) => {
  try {
    let { token, otp } = req.body;

    if (!token || !otp) {
      return res.status(400).json({ message: "Token and OTP required" });
    }

    // ✅ Sanitize token (prevents ?token=undefined issue)
    token = token.split("?")[0];

    const invite = await Invite.findOne({
      token,
      used: false
    });

    if (!invite) {
      return res.status(400).json({ message: "Invalid invite token" });
    }

    if (Date.now() > invite.expiresAt.getTime()) {
      return res.status(400).json({ message: "Invite expired" });
    }

    if (invite.otpVerified) {
      return res.status(400).json({ message: "OTP already verified" });
    }

    if (invite.otp !== otp) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    invite.otpVerified = true;
    await invite.save();

    res.status(200).json({
      message: "OTP verified successfully"
    });

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
      name: req.body.name,
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
    const { companyId } = req.params;
    // const invite = req.invite;
    // if (!invite.companyId)
    //   return res.status(400).json({ message: "Company not created yet" });

    // find email in invite if not exists in Invite give error
    const verifyEmail = await Invite.findOne({ email: req.body.email });
    if (!verifyEmail) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }


    // SAME payload as super admin (+ password)
    const adminPayload = {
      fullName: req.body.fullName,
      email: req.body.email,
      contact: req.body.contact,
      role: req.body.role,
    };

    const result = await CompanyService.createCompanyAdminOfInvite(
      companyId,
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
    const { companyId } = req.params;
    const invite = req.invite;
    // if (!invite.companyId)
    //   return res.status(400).json({ message: "Company not created yet" });

    const company = await CompanyService.setupWorkspace(
      companyId,
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


exports.inviteUploadCompanyBranding = async (req, res) => {
  try {
    const companyId =  req.params.companyId;

    if (!req.files || (!req.files["brand-logo"] && !req.files["cover-image"])) {
      return res.status(400).json({
        message: "At least one image (brand-logo or cover-image) is required"
      });
    }

    const updateData = {};

    if (req.files["brand-logo"]) {
      updateData["branding.logo"] =
        req.files["brand-logo"][0].location;
    }

    if (req.files["cover-image"]) {
      updateData["branding.loginImage"] =
        req.files["cover-image"][0].location;
    }

    const company = await Company.findByIdAndUpdate(
      companyId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({
      message: "Company branding updated",
      branding: company.branding
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};