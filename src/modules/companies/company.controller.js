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


exports.uploadBrandLogo = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.user.companyId,
      { "branding.logo": req.file.location },
      { new: true }
    );

    res.json({
      message: "Brand logo uploaded",
      logo: company.branding.logo,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Upload Login Image
 */
exports.uploadLoginImage = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.user.companyId,
      { "branding.loginImage": req.file.location },
      { new: true }
    );

    res.json({
      message: "Login image uploaded",
      loginImage: company.branding.loginImage,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};