const Company = require("../modules/companies/company.model");


module.exports = async (req, res, next) => {
  try {
    // 1️⃣ Prefer explicit tenant header
    const tenantHost =
      req.headers["x-tenant"] ||
      req.headers.origin ||
      req.headers.referer;

    if (!tenantHost) {
      req.tenant = null;
      return next();
    }

    const hostname = new URL(tenantHost).hostname;
    const cleanHost = hostname.replace("www.", "");

    // 2️⃣ Root → SUPER_ADMIN
    const rootDomains = [
      "qcsstudios.com",
      "localhost"
    ];

    if (
      rootDomains.includes(cleanHost) ||
      /^\d+\.\d+\.\d+\.\d+$/.test(cleanHost)
    ) {
      req.tenant = null;
      return next();
    }

    // 3️⃣ Subdomain → COMPANY
    const subdomain = cleanHost.split(".")[0];
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

