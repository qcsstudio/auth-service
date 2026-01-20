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

    const setupUrl = `${process.env.FRONTEND_URL}/setup?token=${token}`;

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
  const { token } = req.query;

  const invite = await Invite.findOne({ token, used: false });
  if (!invite) return res.status(400).json({ message: "invalid invite" });

  if (invite.expiresAt < new Date()) {
    return res.status(400).json({ message: "invite expired" });
  }

  res.json({
    email: invite.email,
    trial: invite.trial,
    role: invite.role
  });
};
