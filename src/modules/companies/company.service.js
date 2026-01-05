const Company = require("./company.model");
const User = require("../users/user.model");
const bcrypt = require("bcrypt");
const { generateTempPassword } = require("../../utils/password");
const { sendWorkspaceEmail } = require("../../utils/mailer");


/* STEP 1 — company setup */
exports.createCompany = async (data) => {
  const { name, slug, country, timezone, currency } = data;

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

/* STEP 2 — admin setup */
exports.createCompanyAdmin = async (companyId, data) => {
  const company = await Company.findById(companyId);
  if (!company) throw new Error("company not found");

  if (company.adminId) {
    throw new Error("admin already exists");
  }

  const { name, email, contact } = data;

  const exists = await User.findOne({ email });
  if (exists) throw new Error("email already in use");

  const tempPassword = Math.random().toString(36).slice(-8);
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


exports.setupWorkspace = async (companyId, data) => {
  const company = await Company.findById(companyId);
  if (!company) throw new Error("company not found");

  if (!company.adminId) {
    throw new Error("company admin not created");
  }

  // generate company url
  const companyUrl = `${company.slug}.qcs.com`;

  // update workspace
  company.workspace = {
    ...data,
    companyUrl
  };

  company.status = "ACTIVE";
  await company.save();

  // fetch admin
  const admin = await User.findById(company.adminId);
  if (!admin) throw new Error("admin not found");

  // generate NEW temp password
  const tempPassword = generateTempPassword();
  const hashed = await bcrypt.hash(tempPassword, 10);

  admin.password = hashed;
  admin.mustChangePassword = true;
  await admin.save();

  // send email
  await sendWorkspaceEmail({
    to: admin.email,
    companyName: company.name,
    companyUrl,
    username: admin.email,
    password: tempPassword
  });

  return company;
};
