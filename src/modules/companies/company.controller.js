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
    const companyId = req.user?.companyId || req.params.companyId;

    const company = await Company.findByIdAndUpdate(
      companyId,
      { "branding.logo": req.file.location },
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json({
      message: "Brand logo uploaded",
      logo: company.branding?.logo || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadLoginImage = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.params.companyId;

    const company = await Company.findByIdAndUpdate(
      companyId,
      { "branding.loginImage": req.file.location },
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json({
      message: "Login image uploaded",
      loginImage: company.branding?.loginImage || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
