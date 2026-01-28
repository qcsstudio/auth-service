const mongoose = require("mongoose");
const Company = require("./company.model"); // ✅ MODEL
const User = require("../users/user.model");
const bcrypt = require("bcrypt");
const { generateTempPassword, generateStrongPassword } = require("../../utils/password");
const { sendWorkspaceEmail, sendAdminWelcomeEmail } = require("../../utils/mailer");

exports.createCompany = async (data) => {
  const { name, slug, country, timezone, currency, customUrl, industryType } = data;

  if (!name || !slug) {
    throw new Error("name and slug are required");
  }

  // Auto-generate customUrl if not provided
  let finalCustomUrl = customUrl || `${slug}.qcs.com`;

  // Check if slug exists
  const slugExists = await Company.findOne({ slug });
  if (slugExists) throw new Error("company slug already exists");

  // Ensure customUrl is unique
  let i = 1;
  while (await Company.findOne({ customUrl: finalCustomUrl })) {
    finalCustomUrl = `${slug}-${i}.qcs.com`;
    i++;
  }

  // Create the company
  return await Company.create({
    name,
    slug,
    customUrl: finalCustomUrl,
    industryType,
    country,
    timezone,
    currency
  });
};


// CREATE COMPANY ADMIN
exports.createCompanyAdmin = async (companyId, data) => {
  // 1️⃣ validate companyId
  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    throw new Error("invalid company id");
  }

  const company = await Company.findById(companyId);
  if (!company) throw new Error("company not found");

  // 2️⃣ prevent duplicate admin
  if (company.adminId) {
    throw new Error("admin already exists");
  }

  // 3️⃣ extract payload
  const { fullName, email, contact, role } = data;
  if (!fullName || !email || !role) {
    throw new Error("fullName, email and role are required");
  }

  // 4️⃣ check email uniqueness (global)
  const emailExists = await User.findOne({ email });
  if (emailExists) {
    throw new Error("email already in use");
  }

  // 5️⃣ generate temp password
  const tempPassword = generateStrongPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  // 6️⃣ create admin
  const admin = await User.create({
    name: fullName,
    email,
    contact,
    role,
    companyId: company._id,
    password: hashedPassword,
    mustChangePassword: true
  });

  // 7️⃣ attach admin to company
  company.adminId = admin._id;
  await company.save();

  // 8️⃣ send welcome email
  await sendAdminWelcomeEmail({
    to: admin.email,
    name: admin.name,
    companyUrl: company.customUrl,
    tempPassword
  });

  return { admin };
};

// SETUP WORKSPACE
exports.setupWorkspace = async (companyId, data) => {
  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    throw new Error("invalid company id");
  }

  const company = await Company.findById(companyId);
  if (!company) throw new Error("company not found");

  if (!company.adminId) {
    throw new Error("company admin not created");
  }

  // Auto-generate workspace URL
  const companyUrl = `${company.slug}.qcs.com`;

  company.workspace = {
    ...data,
    companyUrl
  };
  company.status = "ACTIVE";
  await company.save();

  const admin = await User.findById(company.adminId);
  if (!admin) throw new Error("admin not found");

  // Generate new temp password for workspace email
  const tempPassword = generateTempPassword();
  const hashed = await bcrypt.hash(tempPassword, 10);

  admin.password = hashed;
  admin.mustChangePassword = true;
  await admin.save();

  // Send workspace email
  await sendWorkspaceEmail({
    to: admin.email,
    companyName: company.name,
    companyUrl,
    username: admin.name,
    password: tempPassword
  });

  return company;
};
