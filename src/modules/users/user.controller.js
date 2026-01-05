const User = require("./user.model");
const bcrypt = require("bcrypt");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new Error("invalid credentials");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("invalid credentials");

  if (user.mustChangePassword) {
    return res.status(200).json({
      forcePasswordChange: true,
      userId: user._id
    });
  }

  res.json({ message: "login success" });
};
