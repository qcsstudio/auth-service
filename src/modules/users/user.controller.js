const User = require("./user.model");
const Company = require("../companies/company.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const service = require("./user.service");


exports.login = async (req, res) => {
  try {
    const { email, password, companySlug } = req.body;

    if (!email || !password || !companySlug) {
      return res.status(400).json({ message: "email, password, and companySlug required" });
    }

    // 1️⃣ find company
    const company = await Company.findOne({ slug: companySlug });
    if (!company) return res.status(400).json({ message: "invalid company" });
    if (company.status !== "ACTIVE") return res.status(400).json({ message: "company is not active" });

    // 2️⃣ find user
    const user = await User.findOne({
      email,
      companyId: company._id,
      role: "COMPANY_ADMIN"
    });

    if (!user) return res.status(401).json({ message: "invalid credentials" });

    // 3️⃣ check password
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "invalid credentials" });

    // 4️⃣ force password change case
    if (user.mustChangePassword) {
      return res.status(200).json({
        forcePasswordChange: true,
        userId: user._id
      });
    }

    // 5️⃣ issue JWT
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        companyId: company._id
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "login success",
      token
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


/* CHANGE PASSWORD */
exports.changePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "all fields required" });
    }

    const token = await service.changePassword({
      userId,
      oldPassword,
      newPassword
    });

    res.json({
      message: "password changed successfully",
      token
    });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
