const Company = require("../modules/companies/company.model");

module.exports = async (req, res, next) => {
  try {
    const host = req.headers.host;

    if (!host) {
      req.tenant = null;
      return next();
    }

    const cleanHost = host.split(":")[0];

    // 🔥 SKIP tenant for IP or localhost
    if (
      cleanHost === "localhost" ||
      /^\d+\.\d+\.\d+\.\d+$/.test(cleanHost)
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

    const subdomain = parts[0];

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
