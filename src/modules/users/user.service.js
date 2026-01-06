const User = require("./user.model");
const Company = require("../companies/company.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


exports.companyAdminLogin = async ({ email, password, companySlug }) => {
  // 1. find company
  const company = await Company.findOne({ slug: companySlug });
  if (!company) throw new Error("invalid company");

  if (company.status !== "ACTIVE") {
    throw new Error("company is not active");
  }

  // 2. find company admin user
  const user = await User.findOne({
    email,
    companyId: company._id,
    role: "COMPANY_ADMIN"
  });

  if (!user) throw new Error("invalid credentials");

  // 3. verify password
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("invalid credentials");

  // 4. force password change
  if (user.mustChangePassword) {
    return {
      forcePasswordChange: true,
      userId: user._id
    };
  }

  // 5. issue jwt
  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
      companyId: company._id
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return {
    token,
    user
  };
};


exports.changePassword = async ({ userId, oldPassword, newPassword }) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("user not found");

  // check old password
  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) throw new Error("old password incorrect");

  // hash new password
  const hashed = await bcrypt.hash(newPassword, 10);

  user.password = hashed;
  user.mustChangePassword = false;
  await user.save();

  // issue token
  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
      companyId: user.companyId
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return token;
};
