const Company = require("../modules/companies/company.model");

module.exports = async (req, res, next) => {
  try {
    const host = req.headers.host;

    if (!host) {
      req.tenant = null;
      return next();
    }

    const cleanHost = host.split(":")[0]; // remove port if any

    // 🔥 SKIP tenant for IP, localhost, or global API domain
    if (
      cleanHost === "localhost" ||
      /^\d+\.\d+\.\d+\.\d+$/.test(cleanHost) ||
      cleanHost === "api.qcsstudios.com" // treat this as global/superadmin
    ) {
      req.tenant = null;
      return next();
    }

    const parts = cleanHost.split(".");

    // ROOT DOMAIN (no subdomain)
    if (parts.length < 3) {
      req.tenant = null;
      return next();
    }

    // Get subdomain
    const subdomain = parts[0];

    // Find company by slug
    const company = await Company.findOne({ slug: subdomain });

    if (!company) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    req.tenant = {
      companyId: company._id,
      slug: company.slug,
      status: company.status
    };

    next();
  } catch (err) {
    next(err);
  }
};
