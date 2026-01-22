const crypto = require("crypto");
const Invite = require("./invite.model");
const { sendInviteEmail } = require("../../utils/mailer");

exports.sendSetupLink = async (req, res) => {
  try {
    const { email, role, trial, linkExpiry } = req.body;

    if (!email || !linkExpiry) {
      return res.status(400).json({ message: "email and expiry required" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const invite = await Invite.create({
      email,
      role: role || "COMPANY_ADMIN",
      trial: !!trial,
      expiresAt: new Date(linkExpiry),
      token
    });

const setupUrl = `${process.env.BACKEND_URL}/invites/validate-invite?token=${token}`;

    await sendInviteEmail({
      to: email,
      setupUrl
    });

    res.json({
      message: "setup link sent",
      inviteId: invite._id
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.validateInvite = async (req, res) => {
  try {
    const { token } = req.query;

    const invite = await Invite.findOne({ token, used: false });
    if (!invite) {
      return res.redirect("https://qcshrms.vercel.app/invalid-invite");
    }

    if (invite.expiresAt < new Date()) {
      return res.redirect("https://qcshrms.vercel.app/invite-expired");
    }

    // ✅ VALID INVITE → REDIRECT USER
    const redirectUrl = `https://qcshrms.vercel.app/org-setup?token=${token}`;

    return res.redirect(redirectUrl);

  } catch (err) {
    console.error(err);
    return res.redirect("https://qcshrms.vercel.app/error");
  }
};
