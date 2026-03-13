const mongoose = require("mongoose");
const { isValidObjectId } = mongoose;

const Company = require("./company.model");
const User = require("../users/models/user.model");
const Employee = require("../users/models/employee.model");

const bcrypt = require("bcrypt");

const {
  generateTempPassword,
  generateStrongPassword
} = require("../../utils/password");

const {
  sendWorkspaceEmail,
  sendAdminWelcomeEmail
} = require("../../utils/mailer");

const { readExcelFile } = require("../../utils/excelReader");



exports.createCompany = async (data) => {
  const {
    name,
    slug,
    country,
    timezone,
    currency,
    customUrl,
    industryType,
    createdBy
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
    createdBy
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

  const tempPassword = generateStrongPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const admin = await User.create({
    name: fullName,
    email,
    contact,
    role,
    companyId,
    password: hashedPassword,
    adminTempPassword: tempPassword,
    mustChangePassword: true
  });

  company.adminId = admin._id;
  await company.save();

  await sendAdminWelcomeEmail({
    to: email,
    companyName: company.name,
    companySlug: company.slug,
    username: email,
    password: tempPassword
  });

  return { adminId: admin._id };
};




exports.createCompanyAdminOfInvite = async (companyId, data) => {
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

  const tempPassword = generateStrongPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const admin = await User.create({
    name: fullName,
    email,
    contact,
    role,
    companyId: company._id,
    password: hashedPassword,
    mustChangePassword: true
  });

  company.adminId = admin._id;
  await company.save();

  await sendAdminWelcomeEmail({
    to: admin.email,
    companyName: company.name,
    companySlug: company.slug,
    username: admin.email,
    password: tempPassword
  });

  return { admin };
};



exports.setupWorkspace = async (companyId, data) => {
  if (!mongoose.Types.ObjectId.isValid(companyId)) {
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




exports.addEmployee = async (companyId, data) => {
  if (!isValidObjectId(companyId)) {
    throw new Error("invalid company id");
  }

  const {
    fullName,
    workEmail,
    phone,
    employeeId,
    department,
    designation,
    reportingManager,
    locationBranch,
    joinDate,
    employeeType,
    probationEndDate,
    shift,
    systemRole
  } = data;

  if (
    !fullName ||
    !workEmail ||
    !employeeId ||
    !department ||
    !designation ||
    !locationBranch ||
    !joinDate ||
    !employeeType ||
    !systemRole
  ) {
    throw new Error(
      "missing required fields: fullName, workEmail, employeeId, department, designation, locationBranch, joinDate, employeeType, systemRole"
    );
  }

  const emailExists = await Employee.findOne({
    companyId,
    workEmail: workEmail.toLowerCase().trim()
  });

  if (emailExists) {
    throw new Error("email already exists for company");
  }

  const idExists = await Employee.findOne({
    companyId,
    employeeId: employeeId.trim()
  });

  if (idExists) {
    throw new Error("employee id already exists for company");
  }

  let reportingManagerId = null;

  if (reportingManager) {
    const manager = await Employee.findOne({
      companyId,
      employeeId: reportingManager
    });

    if (!manager) {
      throw new Error(
        `reporting manager with id "${reportingManager}" not found`
      );
    }

    reportingManagerId = manager._id;
  }

  const employee = await Employee.create({
    companyId,
    fullName: fullName.trim(),
    workEmail: workEmail.toLowerCase().trim(),
    phone: phone ? phone.trim() : undefined,
    employeeId: employeeId.trim(),
    department: department.trim(),
    designation: designation.trim(),
    reportingManager: reportingManagerId,
    locationBranch: locationBranch.trim(),
    joinDate,
    employeeType,
    probationEndDate,
    shift,
    systemRole,
    status: "active"
  });

  return employee;
};



exports.bulkUploadEmployees = async (companyId, excelFile) => {
  if (!isValidObjectId(companyId)) {
    throw new Error("invalid company id");
  }

  if (!excelFile) {
    throw new Error("excel file is required");
  }

  const jsonData = readExcelFile(excelFile.buffer);

  if (!jsonData || jsonData.length === 0) {
    throw new Error("excel file is empty");
  }

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

  const insertedEmployees = await Employee.insertMany(employees, {
    ordered: false
  });

  return {
    totalRows: jsonData.length,
    successCount: insertedEmployees.length,
    failureCount: validationErrors.length,
    importedEmployees: insertedEmployees.map(e => ({
      _id: e._id,
      employeeId: e.employeeId,
      fullName: e.fullName,
      workEmail: e.workEmail
    })),
    errors: validationErrors
  };
};