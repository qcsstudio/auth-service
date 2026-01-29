const service = require("./company.service");

/* STEP 1 — create company */
exports.createCompany = async (req, res) => {
  try {
    const payload = {
      name: req.body.companyName,   // 👈 mapping
      slug: req.body.slug,
      customUrl: req.body.customUrl,
      industryType: req.body.industryType,
      country: req.body.country,
      timezone: req.body.timezone,
      currency: req.body.currency
    };

    const company = await service.createCompany(payload);

    res.status(201).json({
      message: "company created",
      companyId: company._id
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


/* STEP 2 — create company admin */
exports.createCompanyAdmin = async (req, res) => {
  try {
    const { companyId } = req.params;

    const result = await service.createCompanyAdmin(
      companyId,
      req.body
    );

    res.status(201).json({
      message: "admin created",
      adminId: result.admin._id,
      tempPassword: result.tempPassword
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* STEP 3 — setup workspace */
exports.setupWorkspace = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await service.setupWorkspace(
      companyId,
      req.body
    );

    res.status(200).json({
      message: "workspace setup completed",
      companyId: company._id,
      companyUrl: company.workspace.companyUrl
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// exports.bulkUploadCompanyDetails = async (req, res) => {
//   try {
//      if (!req.file) {
//       return res.status(400).json({ message: "Excel file required" });
//     }

//     const result = await service.bulkUploadCompanyDetails(req.file.path);

//     res.status(200).json({
//       total: result.total,
//       success: result.success.length,
//       failed: result.failed.length,
//       failedRows: result.failed
//     });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };


exports.addEmployee = async (req, res) => {
  try {
    const { companyId } = req.params;
    const employee = await service.addEmployee(companyId, req.body);

    res.status(201).json({
      message: "employee added successfully",
      employeeId: employee._id,
      data: employee
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.bulkUploadEmployees = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "excel file is required" });
    }

    const result = await service.bulkUploadEmployees(companyId, req.file);

    const status = result.failureCount === 0 ? 200 : 206; // 206 = Partial Content

    res.status(status).json({
      message:
        result.failureCount === 0
          ? `imported ${result.successCount} employees successfully`
          : `imported ${result.successCount} employees, ${result.failureCount} failed`,
      data: {
        uploadBatch: result.uploadBatch,
        totalRows: result.totalRows,
        successCount: result.successCount,
        failureCount: result.failureCount,
        importedEmployees: result.importedEmployees
      },
      ...(result.errors.length > 0 && { errors: result.errors })
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
