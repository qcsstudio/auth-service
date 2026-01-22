const service = require("./superadmin.service");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "email and password required" });

    const { admin, token } = await service.login(email, password);

    res.json({
      message: "login successful",
      token,
      user: {
        id: admin._id,
        email: admin.email,
        role: "SUPER_ADMIN"
      }
    });
  } catch (err) {
    res.status(401).json({ message: err.message });
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
