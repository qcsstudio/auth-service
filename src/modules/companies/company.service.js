const mongoose = require("mongoose");
const Company = require("./company.model"); // ✅ MODEL
const User = require("../users/user.model");
const bcrypt = require("bcrypt");
const isValidObjectId = require("../../utils/validateObjectId");
const { generateTempPassword } = require("../../utils/password");
const { sendWorkspaceEmail } = require("../../utils/mailer");


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

/* bulk upload */

// exports.bulkUploadCompanyDetails = async (filePath) => {
//   const workbook = XLSX.readFile(filePath);
//   const sheet = workbook.Sheets[workbook.SheetNames[0]];
//   const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
//   // const rows = readExcelFile(filePath);

//   const success = [];
//   const failed = [];

//   for (let i = 0; i < rows.length; i++) {
//     const row = rows[i];
//     const rowNumber = i + 2;

//     try {

//       const company = await exports.createCompany({
//         name: row.company_name,
//         slug: row.company_slug,
//         country: row.country,
//         timezone: row.timezone,
//         currency: row.currency
//       });

//       await exports.createCompanyAdmin(
//         company._id,
//         {
//           name: row.admin_name,
//           email: row.admin_email,
//           contact: row.admin_contact
//         }
//       );

//       await exports.setupWorkspace(
//         company._id,
//         {
//           trial: row.trial === "YES",
//           whiteLabel: row.whiteLabel === "YES",
//           employeeLimit: Number(row.employeeLimit),
//           trialEndDate: row.trialEndDate || null,
//           partnerReseller: row.partnerReseller
//         }
//       );

//       success.push({ row: rowNumber, companyId: company._id });

//     } catch (err) {
//       failed.push({ row: rowNumber, reason: err.message });
//     } finally {
//     }
//   }

//   fs.unlinkSync(filePath);

//   return { total: rows.length, success, failed };
// };




const Employee = require("../users/models/employee.model");
const { v4: uuidv4 } = require("uuid");


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
    systemRole,
  } = data;

  if (!fullName || !workEmail || !employeeId || !department || !designation || !locationBranch || !joinDate || !employeeType || !systemRole) {
    throw new Error("missing required fields: fullName, workEmail, employeeId, department, designation, locationBranch, joinDate, employeeType, systemRole");
  }

  const emailExists = await Employee.findOne({
    companyId,
    workEmail: workEmail.toLowerCase().trim()
  });

  if (emailExists) {
    throw new Error(`email already exists for company`);
  }

  const idExists = await Employee.findOne({
    companyId,
    employeeId: employeeId.trim()
  });

  if (idExists) {
    throw new Error(`employee id already exists for company`);
  }

  let reportingManagerId = null;

  if (reportingManager) {
    const manager = await Employee.findOne({
      companyId,
      employeeId: reportingManager
    });

    if (!manager) {
      throw new Error(`reporting manager with id "${reportingManager}" not found`);
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
  // 1️⃣ validate companyId
  if (!isValidObjectId(companyId)) {
    throw new Error("invalid company id");
  }

  if (!excelFile) {
    throw new Error("excel file is required");
  }
  console.log(excelFile)
  // 2️⃣ read excel file
  const jsonData = readExcelFile(excelFile.path);

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

  const firstRow = jsonData[0];
  const missingColumns = requiredColumns.filter(col => !(col in firstRow));

  if (missingColumns.length > 0) {
    throw new Error(
      `missing required columns: ${missingColumns.join(", ")}`
    );
  }

  const employees = [];
  const errors = [];

  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    const rowNumber = i + 2; 

    try {
      // Validate and transform data
      const fullName = row.fullName?.trim();
      const workEmail = row.workEmail?.trim().toLowerCase();
      const phone = row.phone?.trim();
      const employeeId = row.employeeId?.trim();
      const department = row.department?.trim();
      const designation = row.designation?.trim();
      const locationBranch = row.locationBranch?.trim();
      const joinDate = row.joinDate;
      const employeeType = row.employeeType?.trim();
      const systemRole = row.systemRole?.trim() || "Employee";
      const shift = row.shift?.trim() || "Morning";
      const reportingManagerId = row.reportingManager?.trim();
      const probationEndDate = row.probationEndDate;

      // Validate required fields
      if (!fullName) throw new Error("fullName is required");
      if (!workEmail) throw new Error("workEmail is required");
      if (!employeeId) throw new Error("employeeId is required");
      if (!department) throw new Error("department is required");
      if (!designation) throw new Error("designation is required");
      if (!locationBranch) throw new Error("locationBranch is required");
      if (!joinDate) throw new Error("joinDate is required");
      if (!employeeType) throw new Error("employeeType is required");

      const emailInDb = await Employee.findOne({
        companyId,
        workEmail
      });
      if (emailInDb) {
        throw new Error("email already exists in database");
      }


      // Validate reporting manager if provided
      let reportingManager = null;
      if (reportingManagerId) {
        const manager = await Employee.findOne({
          companyId,
          employeeId: reportingManagerId
        });
        if (!manager) {
          throw new Error(
            `reporting manager with id "${reportingManagerId}" not found`
          );
        }
        reportingManager = manager._id;
      }

      // Prepare employee object
      const employeeData = {
        companyId,
        fullName,
        workEmail,
        phone: phone || undefined,
        employeeId,
        department,
        designation,
        reportingManager,
        locationBranch,
        joinDate,
        employeeType,
        probationEndDate,
        shift,
        systemRole,
      };

      employees.push(employeeData);
    } catch (error) {
      errors.push({
        rowNumber,
        employeeId: row.employeeId || "N/A",
        message: error.message
      });
    }
  }

  // if no valid rows, return error
  if (employees.length === 0) {
    throw new Error(
      `no valid employee records to import. errors: ${errors
        .map(e => `row ${e.rowNumber}: ${e.message}`)
        .join("; ")}`
    );
  }

  // bulk insert to database
  const insertedEmployees = [];
  const insertErrors = [];

  try {
    const result = await Employee.insertMany(employees, { ordered: false });
    insertedEmployees.push(...result);
  } catch (dbError) {
    if (dbError.insertedDocs) {
      insertedEmployees.push(...dbError.insertedDocs);
    }

    if (dbError.writeErrors) {
      dbError.writeErrors.forEach(err => {
        const empData = employees[err.index];
        let errorMessage = err.errmsg;

        if (err.code === 11000) {
          const field = Object.keys(err.keyPattern || {})[0];
          errorMessage = `${field} already exists in database`;
        }

        insertErrors.push({
          employeeId: empData.employeeId,
          message: errorMessage
        });
      });
    }
  }
  
  // return response
  return {
    totalRows: jsonData.length,
    successCount: insertedEmployees.length,
    failureCount: errors.length + insertErrors.length,
    importedEmployees: insertedEmployees.map(e => ({
      _id: e._id,
      employeeId: e.employeeId,
      fullName: e.fullName,
      workEmail: e.workEmail
    })),
    errors: [...errors, ...insertErrors]
  };
};