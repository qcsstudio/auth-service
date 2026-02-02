const Company = require("../modules/companies/company.model");

module.exports = async (req, res, next) => {
  try {
    const host = req.headers.host;
    if (!host) {
      req.tenant = null;
      return next();
    }

    const cleanHost = host.split(":")[0].toLowerCase();

    // 🚫 Root domains → SUPER_ADMIN
    const rootDomains = ["localhost", "api.qcsstudios.com", "www.qcsstudios.com", "qcsstudios.com"];
    if (rootDomains.includes(cleanHost) || /^\d+\.\d+\.\d+\.\d+$/.test(cleanHost)) {
      req.tenant = null; // SUPER_ADMIN
      return next();
    }

    // ✅ Otherwise, detect subdomain for company
    const parts = cleanHost.split(".");
    if (parts.length < 3) {
      req.tenant = null; // fallback to SUPER_ADMIN
      return next();
    }

    const subdomain = parts[0];
    const company = await Company.findOne({ slug: subdomain });

    if (!company) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    req.tenant = {
      companyId: company._id,
      slug: company.slug,
      status: company.status,
    };

    next();
  } catch (err) {
    next(err);
  }
};
