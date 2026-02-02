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
    const rootDomains = [
      "localhost",
      "api.qcstudios.com",
      "www.qcsstudios.com",
      "qcsstudios.com",
    ];
    if (rootDomains.includes(cleanHost) || /^\d+\.\d+\.\d+\.\d+$/.test(cleanHost)) {
      req.tenant = null; // SUPER_ADMIN
      return next();
    }

    const tenantBases = ["qcsstudios.com"];
    const tenantBase = tenantBases.find((base) => cleanHost.endsWith(`.${base}`));
    if (!tenantBase) {
      req.tenant = null; // fallback to SUPER_ADMIN
      return next();
    }

    const subdomainPart = cleanHost.slice(0, -(tenantBase.length + 1));
    const subdomain = subdomainPart.split(".")[0];
    if (!subdomain) {
      req.tenant = null;
      return next();
    }
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
