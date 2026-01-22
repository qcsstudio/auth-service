const Company = require("./company.model");
const User = require("../users/user.model");
const Invite = require("../invites/invite.model");

const bcrypt = require("bcrypt");
const isValidObjectId = require("../../utils/validateObjectId");
const { generateTempPassword } = require("../../utils/password");
const { sendWorkspaceEmail } = require("../../utils/mailer");

/* STEP 1 — create company */
exports.createCompany = async (data) => {
  const { name, slug, country, timezone, currency } = data;

  if (!name || !slug) {
    throw new Error("name and slug are required");
  }

  const exists = await Company.findOne({ slug });
  if (exists) throw new Error("company slug already exists");

   return await Company.create({
    name: data.companyName,
    slug: data.slug,
    customUrl: data.customUrl,
    industryType: data.industryType,
    country: data.country,
    timezone: data.timezone,
    currency: data.currency
  });
};

exports.createCompanyAdmin = async (companyId, data) => {
  // 1️⃣ validate companyId
  if (!isValidObjectId(companyId)) {
    throw new Error("invalid company id");
  }

  const company = await Company.findById(companyId);
  if (!company) {
    throw new Error("company not found");
  }

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
    role, // COMPANY_ADMIN
    companyId: company._id,
    password: hashedPassword,
    mustChangePassword: true
  });

  // 7️⃣ attach admin to company
  company.adminId = admin._id;
  await company.save();

  // 8️⃣ send email IMMEDIATELY
  await sendAdminWelcomeEmail({
    to: admin.email,
    name: admin.name,
    companyUrl: company.customUrl,
    tempPassword
  });

  // 9️⃣ return
  return { admin };
};


exports.setupWorkspace = async (companyId, data) => {
  if (!isValidObjectId(companyId)) {
    throw new Error("invalid company id");
  }

  const company = await Company.findById(companyId);
  if (!company) throw new Error("company not found");

  if (!company.adminId) {
    throw new Error("company admin not created");
  }

  const companyUrl = `${company.slug}.qcs.com`;

  company.workspace = {
    ...data,
    companyUrl
  };

  company.status = "ACTIVE";
  await company.save();

  const admin = await User.findById(company.adminId);
  if (!admin) throw new Error("admin not found");
console.log(admin,"----------");
  const tempPassword = generateTempPassword();
  const hashed = await bcrypt.hash(tempPassword, 10);

  admin.password = hashed;
  admin.mustChangePassword = true;
  await admin.save();

  await sendWorkspaceEmail({
    to: admin.email,
    companyName: company.name,
    companyUrl,
    username: admin.name,
    password: tempPassword
  });

  return company;
};
