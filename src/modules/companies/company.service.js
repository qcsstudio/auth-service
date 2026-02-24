const mongoose = require("mongoose");
const Company = require("./company.model"); // ✅ MODEL
const User = require("../users/user.model");
const bcrypt = require("bcrypt");
const { generateTempPassword, generateStrongPassword } = require("../../utils/password");
const { sendWorkspaceEmail, sendWorkspaceEmail2, sendAdminWelcomeEmail } = require("../../utils/mailer");
const { readExcelFile } = require("../../utils/excelReader");
const Employee = require("./employee.model");

exports.createCompany = async (data) => {
  const { 
    name, 
    slug, 
    country, 
    timezone, 
    currency, 
    customUrl, 
    industryType,
    createdBy   // 🔥 ADD THIS
  } = data;

  if (!name || !slug) {
    throw new Error("name and slug are required");
  }

  let finalCustomUrl = customUrl || `${slug}.qcs.com`;

  const slugExists = await Company.findOne({ slug });
  if (slugExists) throw new Error("company slug already exists");

  let i = 1;
  while (await Company.findOne({ customUrl: finalCustomUrl })) {
    finalCustomUrl = `${slug}-${i}.qcs.com`;
    i++;
  }

  return await Company.create({
    name,
    slug,
    customUrl: finalCustomUrl,
    industryType,
    country,
    timezone,
    currency,
    createdBy   // 🔥 SAVE IT HERE
  });
};



exports.createCompanyAdmin = async (companyId, data) => {
  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    throw new Error("invalid company id");
  }

  const company = await Company.findById(companyId);
  if (!company) throw new Error("company not found");

  if (company.adminId) {
    throw new Error("admin already exists");
  }

  const { fullName, email, contact, role } = data;
  if (!fullName || !email || !role) {
    throw new Error("fullName, email and role are required");
  }

  const emailExists = await User.findOne({ email });
  if (emailExists) {
    throw new Error("email already in use");
  }

  // 🔥 Generate temporary password
  const tempPassword = generateStrongPassword();

  // 🔥 Hash it before saving
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  // 🔥 Create the admin user
  const admin = await User.create({
    name: fullName,
    email,
    contact,
    role,
    companyId,
    password: hashedPassword,      // hash stored here
    adminTempPassword: tempPassword, // optional, for email only
    mustChangePassword: true
  });

  // 🔥 Assign adminId to company
  company.adminId = admin._id;
  await company.save();

 // 🔥 Send welcome email immediately
await sendAdminWelcomeEmail({
  to: email,
  companyName: company.name,
  companySlug: company.slug,
  username: email,
  password: tempPassword
});


  return { adminId: admin._id };
};


// CREATE COMPANY ADMIN
exports.createCompanyAdminOfInvite = async (companyId, data) => {
  // 1️⃣ validate companyId
  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    throw new Error("invalid company id");
  }

  const company = await Company.findById(companyId);
  if (!company) throw new Error("company not found");
  const companyUrl = `${company.slug}.qcs.com`;

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
    companyName: company.name,
    companySlug: company.slug,
    username: admin.email,
    password: tempPassword
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


exports.bulkUploadEmployees = async (companyId, excelFile) => {
  // 1️⃣ validate companyId
  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    throw new Error("invalid company id");
  }

  if (!excelFile) {
    throw new Error("excel file is required");
  }

  // 2️⃣ read excel
  const jsonData = readExcelFile(excelFile.buffer);
  if (!jsonData || jsonData.length === 0) {
    throw new Error("excel file is empty");
  }

  // 3️⃣ validate required columns
  const requiredColumns = [
    "fullName",
    "workEmail",
    "employeeId",
    "department",
    "designation",
    "locationBranch",
    "joinDate",
    "employeeType",
    "systemRole"
  ];

  const missingColumns = requiredColumns.filter(
    col => !(col in jsonData[0])
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `missing required columns: ${missingColumns.join(", ")}`
    );
  }

  const employees = [];
  const validationErrors = [];

  // 4️⃣ validate rows
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    const rowNumber = i + 2;

    try {
      const fullName = row.fullName?.trim();
      const workEmail = row.workEmail?.trim().toLowerCase();
      const employeeId = row.employeeId?.trim();
      const department = row.department?.trim();
      const designation = row.designation?.trim();
      const locationBranch = row.locationBranch?.trim();
      const joinDate = row.joinDate;
      const employeeType = row.employeeType?.trim();
      const systemRole = row.systemRole?.trim() || "Employee";

      if (
        !fullName ||
        !workEmail ||
        !employeeId ||
        !department ||
        !designation ||
        !locationBranch ||
        !joinDate ||
        !employeeType
      ) {
        throw new Error("missing required field");
      }

      const emailExists = await Employee.findOne({
        companyId,
        workEmail
      });
      if (emailExists) {
        throw new Error("email already exists");
      }

      employees.push({
        companyId,
        fullName,
        workEmail,
        employeeId,
        department,
        designation,
        locationBranch,
        joinDate,
        employeeType,
        systemRole
      });
    } catch (err) {
      validationErrors.push({
        rowNumber,
        employeeId: row.employeeId || "N/A",
        message: err.message
      });
    }
  }

  if (employees.length === 0) {
    throw new Error("no valid employees to import");
  }

  // 5️⃣ bulk insert
  let insertedEmployees = [];
  let insertErrors = [];

  try {
    insertedEmployees = await Employee.insertMany(employees, {
      ordered: false
    });
  } catch (dbError) {
    if (dbError.insertedDocs) {
      insertedEmployees = dbError.insertedDocs;
    }

    if (dbError.writeErrors) {
      insertErrors = dbError.writeErrors.map(err => ({
        employeeId: employees[err.index]?.employeeId,
        message:
          err.code === 11000
            ? "duplicate value in database"
            : err.errmsg
      }));
    }
  }

  // 6️⃣ 🔥 SEND ADMIN EMAIL (ONLY IF AT LEAST 1 EMPLOYEE INSERTED)
  if (insertedEmployees.length > 0) {
    const company = await Company.findById(companyId).populate("adminId");
    if (!company || !company.adminId) {
      throw new Error("company admin not found");
    }

    const admin = await User.findById(company.adminId)
      .select("+adminTempPassword");

    if (!admin.isWelcomeEmailSent) {
      await sendAdminWelcomeEmail({
        to: admin.email,
        companyName: company.name,
        companySlug: company.slug,
        username: admin.email,
        password: admin.adminTempPassword
      });

      admin.isWelcomeEmailSent = true;
      admin.adminTempPassword = undefined;
      await admin.save();
    }
  }

  // 7️⃣ return response
  return {
    totalRows: jsonData.length,
    successCount: insertedEmployees.length,
    failureCount:
      validationErrors.length + insertErrors.length,
    importedEmployees: insertedEmployees.map(e => ({
      _id: e._id,
      employeeId: e.employeeId,
      fullName: e.fullName,
      workEmail: e.workEmail
    })),
    errors: [...validationErrors, ...insertErrors]
  };
};