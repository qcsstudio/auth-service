const User = require("./user.model");
const Company = require("../companies/company.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const service = require("./user.service");


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email and password required"
      });
    }

    // 1️⃣ find user first
    const user = await User.findOne({
      email,
      role: "COMPANY_ADMIN"
    });

    if (!user) {
      return res.status(401).json({ message: "invalid credentials" });
    }

    // 2️⃣ find company using user.companyId
    const company = await Company.findById(user.companyId);

    if (!company) {
      return res.status(400).json({ message: "company not found" });
    }

    if (company.status !== "ACTIVE") {
      return res.status(400).json({ message: "company is not active" });
    }

    // 3️⃣ check password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "invalid credentials" });
    }

    // 4️⃣ force password change
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
        role: "ADMIN",
        companyId: company._id
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "login success",
      role: "ADMIN",
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


exports.createInternalUser = async (req, res) => {
  try {
    const { name, email, contact, password, role, companyId } = req.body;

    if (!email || !password || !companyId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await User.findOne({ email, companyId });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      contact,
      password: hashedPassword,
      role: role || "EMPLOYEE",
      companyId
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      }
    });

  } catch (err) {
    console.error("INTERNAL CREATE ERROR:", err);
    res.status(500).json({ message: "User creation failed", error: err.message });
  }
};
