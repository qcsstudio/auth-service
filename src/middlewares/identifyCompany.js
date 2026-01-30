const Company = require("../modules/companies/company.model");

module.exports = async (req, res, next) => {
  try {
    const host = req.headers.host; // xyz.qcs.com
    const subdomain = host.split(".")[0];

    // superadmin domain
    if (subdomain === "superadmin") {
      req.isSuperAdmin = true;
      return next();
    }

    const company = await Company.findOne({
      companyCode: subdomain
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (company.status !== "ACTIVE") {
      return res.status(403).json({ message: "Company inactive" });
    }

    req.company = company;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
