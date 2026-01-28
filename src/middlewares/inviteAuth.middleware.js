const Invite = require("../modules/invites/invite.model");

module.exports = async (req, res, next) => {
  try {
    // ⚠️ header keys are ALWAYS lowercase in Node
    const token = req.headers["x-invite-token"];

    if (!token) {
      return res.status(401).json({ message: "Invite token required" });
    }

    const invite = await Invite.findOne({
      token,
      used: false,
      otpVerified: true
    });

    if (!invite) {
      return res.status(401).json({ message: "Invalid or expired invite" });
    }

    req.invite = invite;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Invite auth failed" });
  }
};
