const service = require("./company.service");
const Company = require("./company.model");

/* STEP 1 — create company */
exports.createCompany = async (req, res) => {
  try {
    const payload = {
      name: req.body.name,  // 👈 mapping
      slug: req.body.slug,
      customUrl: req.body.customUrl,
      industryType: req.body.industryType,
      country: req.body.country,
      timezone: req.body.timezone,
      currency: req.body.currency,
      createdBy: req.user.id 
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


exports.getCompanyBrandingBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({ message: "Company slug is required" });
    }

    const company = await Company.findOne(
      { slug, status: "ACTIVE" },
      {
        name: 1,
        slug: 1,
        branding: 1,
        workspace: 1
      }
    );

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({
      company: {
        name: company.name,
        slug: company.slug,
        logo: company.branding?.logo || null,
        loginImage: company.branding?.loginImage || null,
        workspace: company.workspace
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCompanyBranding = async (req, res) => {
  try {
    const  id  = req.user.id;

    const company = await Company.findOne({ adminId:id })
      .select("_id welcomeTitle welcomeMessage branding.logo branding.loginImage adminId");

    if (!company) {
      return res.status(404).json({
        message: "Company not found for this admin"
      });
    }

    res.status(200).json({
      message: "Company branding fetched successfully",
      data: company
    });

  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
exports.updateCompanyBranding = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const { welcomeTitle, welcomeMessage } = req.body;

    const updateData = {};

    // Text fields
    if (welcomeTitle !== undefined)
      updateData.welcomeTitle = welcomeTitle;

    if (welcomeMessage !== undefined)
      updateData.welcomeMessage = welcomeMessage;

    // File fields (S3)
    if (req.files?.["brand-logo"]) {
      updateData["branding.logo"] =
        req.files["brand-logo"][0].location;
    }

    if (req.files?.["cover-image"]) {
      updateData["branding.loginImage"] =
        req.files["cover-image"][0].location;
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      companyId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select(
      "welcomeTitle welcomeMessage branding.logo branding.loginImage"
    );

    if (!updatedCompany) {
      return res.status(404).json({
        message: "Company not found"
      });
    }

    res.status(200).json({
      message: "Company branding updated successfully",
      data: updatedCompany
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message
    });
  }
};


exports.updateGlobalSetting = async (req, res) => {
  try {
    const id  = req.user.companyId;

    const updateData = {
      name: req.body.name,
      slug: req.body.slug,
      customUrl: req.body.customUrl,
      industryType: req.body.industryType,
      country: req.body.country,
      timezone: req.body.timezone,
      currency: req.body.currency,
      leaveCycleStartMonth: req.body.leaveCycleStartMonth,
      financialYearStartMonth: req.body.financialYearStartMonth,
      dateFormat: req.body.dateFormat,
      timeFormat: req.body.timeFormat,
      callingCode:req.body.callingCode
    };

    const updatedCompany = await Company.findOneAndUpdate(
      { _id:id },
      updateData,
      { new: true, runValidators: true }
    ).select(
      "adminId name slug customUrl industryType country timezone currency leaveCycleStartMonth financialYearStartMonth dateFormat timeFormat callingCode"
    );

    if (!updatedCompany) {
      return res.status(404).json({
      message: "Company not found for this admin"
    });
  }

    res.status(200).json({
      message: "Global settings updated successfully",
      data: updatedCompany
    });

  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getGlobalSetting = async (req, res) => {
  try {
    const adminId = req.user.id;

    const company = await Company.findOne({ adminId }).select(
      "_id adminId name slug customUrl industryType country timezone currency leaveCycleStartMonth financialYearStartMonth dateFormat timeFormat callingCode"
    );

    if (!company) {
      return res.status(404).json({
        message: "Company not found for this admin"
    });
  }

    res.status(200).json({
      message: "Global settings fetched successfully",
      data: company
    });

  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
