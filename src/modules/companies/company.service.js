const Company = require("./company.model");
const User = require("../users/user.model");
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
    name,
    slug,
    country,
    timezone,
    currency,
    status: "DRAFT"
  });
};

/* STEP 2 — create company admin */
exports.createCompanyAdmin = async (companyId, data) => {
  if (!isValidObjectId(companyId)) {
    throw new Error("invalid company id");
  }

  const company = await Company.findById(companyId);
  if (!company) throw new Error("company not found");

  if (company.adminId) {
    throw new Error("admin already exists");
  }

  const { name, email, contact } = data;
  if (!name || !email) {
    throw new Error("name and email are required");
  }

  const emailExists = await User.findOne({ email });
  if (emailExists) throw new Error("email already in use");

  const tempPassword = generateTempPassword();
  const hashed = await bcrypt.hash(tempPassword, 10);

  const admin = await User.create({
    name,
    email,
    contact,
    password: hashed,
    role: "COMPANY_ADMIN",
    companyId: company._id,
    mustChangePassword: true
  });

  company.adminId = admin._id;
  await company.save();

  return { admin, tempPassword };
};

/* STEP 3 — setup workspace */
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
