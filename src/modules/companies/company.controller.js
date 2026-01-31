const service = require("./company.service");
const Company = require("./company.model");

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
      adminId: result.adminId
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
exports.uploadCompanyBranding = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.params.companyId;

    if (!req.files || (!req.files["brand-logo"] && !req.files["cover-image"])) {
      return res.status(400).json({
        message: "At least one image (brand-logo or cover-image) is required"
      });
    }

    const updateData = {};

    if (req.files["brand-logo"]) {
      updateData["branding.logo"] =
        req.files["brand-logo"][0].location;
    }

    if (req.files["cover-image"]) {
      updateData["branding.loginImage"] =
        req.files["cover-image"][0].location;
    }

    const company = await Company.findByIdAndUpdate(
      companyId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({
      message: "Company branding updated",
      branding: company.branding
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
