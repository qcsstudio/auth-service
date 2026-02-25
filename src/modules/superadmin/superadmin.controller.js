const service = require("./superadmin.service");
const mongoose = require("mongoose");

const companymodel = require("../companies/company.model")
// const authService = require("./auth.service");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // 🔥 SUPER ADMIN LOGIN (no tenant)
    if (!req.tenant) {
      const { user, token } = await service.superAdminLogin(email, password);

      return res.json({
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: "SUPER_ADMIN"
        },
        token
      });
    }

    // 🔥 COMPANY LOGIN
    const { user, token, forcePasswordChange } =
      await service.companyAdminLogin(email, password, req.tenant);

    return res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      },
      forcePasswordChange,
      token
    });

  } catch (err) {
    return res.status(401).json({ message: err.message });
  }
};

exports.getSuperAdminDashboardData = async (req, res) => {
  const { role, id } = req.user;

  if (role !== "SUPER_ADMIN") {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId"
      });
    }

    let { status } = req.query;
    const matchStage = { createdBy: new mongoose.Types.ObjectId(id) };

    if (status) {
      status = status.toUpperCase();
      const validStatuses = ["ACTIVE", "PAUSED", "SUSPENDED"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
        });
      }
      matchStage.status = status;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "adminId",
          foreignField: "_id",
          as: "adminDetails"
        }
      },
      {
        $unwind: {
          path: "$adminDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          name: 1,
          slug: 1,
          customUrl: 1,
          industryType: 1,
          country: 1,
          timezone: 1,
          currency: 1,
          status: 1,
          subscription: 1,
          createdBy: 1,
          createdAt: 1,
          adminDetails: {
            _id: "$adminDetails._id",
            name: "$adminDetails.name",
            email: "$adminDetails.email",
            role:"$adminDetails.role"
          }
        }
      },
      {
        $facet: {
          data: [{ $sort: { createdAt: -1 } }],
          count: [{ $count: "total" }]
        }
      }
    ];

    const result = await companymodel.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      message: "Dashboard data fetched successfully",
      data: result[0].data,
      total: result[0].count[0]?.total || 0
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};