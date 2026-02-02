const service = require("./superadmin.service");

// const authService = require("./auth.service");


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password required" });
    }

    // 🔥 CASE 1: SUPER ADMIN (root domain)
    if (!req.tenant) {
      const { user, token } = await service.superAdminLogin(email, password);

      console.log("Login detected: SUPER_ADMIN", user.email);

      return res.json({
        message: "login successful",
        role: "SUPER_ADMIN",
        token,
      });
    }

    // 🔥 CASE 2: COMPANY ADMIN (subdomain)
    const { user, token, forcePasswordChange } = await service.companyAdminLogin(
      email,
      password,
      req.tenant
    );

    console.log("Login detected: COMPANY_ADMIN", user.email, "Tenant:", req.tenant.slug);

    return res.json({
      message: "login successful",
      role: user.role, // should be COMPANY_ADMIN
      forcePasswordChange,
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(401).json({ message: err.message });
  }
};

exports.getSuperAdminDashboardData = async (req, res) => {
  const { role } = req.user;
  if(role ==! "SUPER_ADMIN") return res.status(401).json({ message: "Unauthorized" });
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const pageNumber = Number(page);
    const pageLimit = Number(limit);

    if (pageNumber < 1 || pageLimit < 1) {
      return res.status(400).json({
        success: false,
        message: "Page and limit must be greater than 0"
      });
    }

    if (pageLimit > 100) {
      return res.status(400).json({
        success: false,
        message: "Limit cannot exceed 100"
      });
    }

    const matchStage = {};
    if (status) {
      const validStatuses = ["DRAFT", "ACTIVE", "SUSPENDED"];
      const upperStatus = status.toUpperCase();

      if (!validStatuses.includes(upperStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
        });
      }
      matchStage.status = upperStatus;
    }


    const data = await service.superAdminDashboardData(
      matchStage,
      pageNumber,
      pageLimit
    );

    return res.status(200).json({
      success: true,
      message: "Dashboard data fetched successfully",
      data: data
    });
  } catch (error) {
    // console.error("Error fetching dashboard data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
