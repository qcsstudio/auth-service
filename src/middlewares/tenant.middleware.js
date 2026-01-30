const Company = require("../modules/companies/company.model");

module.exports = async (req, res, next) => {
  const host = req.headers.host; // xyz.qcss.com
  if (!host) {
    return res.status(400).json({ message: "Host header missing" });
  }

  const subdomain = host.split(".")[0];

  // allow root domain (superadmin / marketing site)
  if (subdomain === "qcss" || subdomain === "www") {
    req.tenant = null;
    return next();
  }

  const company = await Company.findOne({ slug: subdomain });
//   if (!company) {
//     return res.status(404).json({ message: "Workspace not found" });
//   }

  req.tenant = company; // 🔥 THIS IS YOUR TENANT CONTEXT
  next();
};
