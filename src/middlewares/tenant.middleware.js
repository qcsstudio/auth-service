const Company = require("../modules/companies/company.model");

module.exports = async (req, res, next) => {
  try {
    const host = req.headers.host; // xyz.qcs.com | localhost:4000
    if (!host) {
      req.tenant = null;
      return next();
    }

    // remove port if exists
    const cleanHost = host.split(":")[0];
    const parts = cleanHost.split(".");

    // ROOT DOMAIN → superadmin / public
    if (parts.length < 3) {
      req.tenant = null;
      return next();
    }

    const subdomain = parts[0];

    const company = await Company.findOne({ slug: subdomain });

    if (!company) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // 🔥 STORE ONLY WHAT YOU NEED
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
