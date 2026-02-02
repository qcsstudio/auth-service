const Company = require("../modules/companies/company.model");

module.exports = async (req, res, next) => {
  try {
    // 🚫 Bypass tenant for global/auth routes
    if (
      req.path.startsWith("/auth/superadmin") ||
      req.path.startsWith("/invites")
    ) {
      req.tenant = null;
      return next();
    }

    const host = req.headers.host;
    if (!host) {
      req.tenant = null;
      return next();
    }

    const cleanHost = host.split(":")[0];

    // 🚫 Non-tenant hosts
    if (
      cleanHost === "localhost" ||
      /^\d+\.\d+\.\d+\.\d+$/.test(cleanHost) ||
      cleanHost === "api.qcsstudios.com" ||
      cleanHost === "www.qcsstudios.com"
    ) {
      req.tenant = null;
      return next();
    }

    const parts = cleanHost.split(".");
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
      status: company.status,
    };

    next();
  } catch (err) {
    next(err);
  }
};
