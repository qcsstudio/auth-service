const User = require("./user.model");
const Company = require("../companies/company.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const service = require("./user.service");
const { sendOTPEmail } = require("../../utils/mailer");


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


exports.changePassword = async (req, res) => {
  try {
    const { userId, newPassword, confirmPassword } = req.body;
    if (!req.tenant) {
      return res.status(400).json({ message: "Tenant header required" });
    }
    if (!userId || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "all fields required" });
    }

    const { user, token } = await service.changePassword({
      userId,
       newPassword,
      confirmPassword,
      tenant: req.tenant
    });

    res.json({
      message: "password changed successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        istemporyPassword: true
      }
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



exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email});

    if (!user)
      return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOTP = otp;
    user.resetOTPExpire = Date.now() + 10 * 60 * 1000;
    user.isOTPVerified = false;

    await user.save();

    await sendOTPEmail({ to: email, otp });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (user.resetOTP !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (user.resetOTPExpire < Date.now())
      return res.status(400).json({ message: "OTP expired" });

    user.isOTPVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "OTP verified"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    // :white_check_mark: Check required fields
    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Email, new password and confirm password are required"
      });
    }

    // :white_check_mark: Check password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match"
      });
    }

    // :white_check_mark: Optional: Password length validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ message: "User not found" });

    // if (!user.isOTPVerified)
    //   return res.status(400).json({ message: "OTP not verified" });

    const hashed = await bcrypt.hash(newPassword, 10);

    user.password = hashed;
    user.resetOTP = undefined;
    user.resetOTPExpire = undefined;
    user.isOTPVerified = false;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};