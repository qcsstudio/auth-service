const Company = require("../modules/companies/company.model");

module.exports = async (req, res, next) => {
  try {
    const host = req.headers.host;
    if (!host) {
      req.tenant = null;
      return next();
    }

    const cleanHost = host.split(":")[0].toLowerCase();

    // 🚫 Non-tenant hosts → SUPER_ADMIN domain
    if (
      cleanHost === "localhost" ||
      /^\d+\.\d+\.\d+\.\d+$/.test(cleanHost) ||
      cleanHost === "api.qcsstudios.com" ||
      cleanHost === "www.qcsstudios.com" ||
      cleanHost === "qcsstudios.com"
    ) {
      req.tenant = null; // root domain → SUPER_ADMIN
      return next();
    }

    // Subdomain → try to find tenant
    const parts = cleanHost.split(".");
    if (parts.length < 3) {
      req.tenant = null; // fallback to root
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
