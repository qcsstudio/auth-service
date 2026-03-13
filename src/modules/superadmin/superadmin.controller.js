const service = require("./superadmin.service");
const mongoose = require("mongoose");

const companymodel = require("../companies/company.model")
// const authService = require("./auth.service");
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ message: "Email and password required" });
//     }

//     // :fire: SUPER ADMIN LOGIN (no tenant)
//     if (!req.tenant) {
//       const { user, token } = await service.superAdminLogin(email, password);

//       return res.json({
//         message: "Login successful",
//         user: {
//           id: user._id,
//           name: user.name,
//           email: user.email,
//           role: "SUPER_ADMIN"
//         },
//         token
//       });
//     }

//     // :fire: COMPANY LOGIN
//     const { user, token, forcePasswordChange } =
//       await service.companyAdminLogin(email, password, req.tenant);

//     return res.json({
//       message: "Login successful",
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         companyId: user.companyId,
//         istemporyPassword:user.istemporyPassword
//       },
//       forcePasswordChange,
//       token
//     });

//   } catch (err) {
//     console.log(err,"eeee")
//     return res.status(401).json({ message: err.message });
//   }
// }; 


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // 1️⃣ Find user (works for all roles)
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 2️⃣ Check company for COMPANY_ADMIN and EMPLOYEE
    if (user.role !== "SUPER_ADMIN") {
      const company = await Company.findById(user.companyId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }
      if (company.status !== "ACTIVE") {
        return res.status(400).json({ message: "Company is not active" });
      }
    }

    // 3️⃣ Password check
    let isPasswordMatch = false;

    // First-time login with temp password
    if (user.mustChangePassword && user.adminTempPassword) {
      isPasswordMatch = password === user.adminTempPassword;
    } else {
      isPasswordMatch = await bcrypt.compare(password, user.password);
    }

    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4️⃣ Force password change for first login
    if (user.mustChangePassword) {
      return res.status(200).json({
        forcePasswordChange: true,
        userId: user._id,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      });
    }

    // 5️⃣ Issue JWT
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        companyId: user.companyId
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      },
      token
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: err.message });
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
        message: "Invalid userId",
      });
    }

    const userId = new mongoose.Types.ObjectId(id);
    let { status } = req.query;

    const baseMatch = { createdBy: userId };
    const dataMatch = { createdBy: userId };

    // :white_check_mark: Optional Status Filter (Only for Data)
    if (status) {
      status = status.toUpperCase();

      const validStatuses = [
        "ACTIVE",
        "PAUSED",
        "SUSPENDED",
        "COMPLETED",
        "DRAFT",
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }

      dataMatch.status = status;
    }

    const pipeline = [
      // :small_blue_diamond: Match for overall base
      { $match: baseMatch },

      // :small_blue_diamond: Lookup Admin
      {
        $lookup: {
          from: "users",
          localField: "adminId",
          foreignField: "_id",
          as: "adminDetails",
        },
      },
      {
        $unwind: {
          path: "$adminDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      // :small_blue_diamond: Lookup Active Employees Count
      {
        $lookup: {
          from: "employees",
          let: { companyId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$companyId", "$$companyId"] },
                    { $eq: [{ $toLower: "$status" }, "active"] },
                  ],
                },
              },
            },
            { $count: "totalEmployees" },
          ],
          as: "employeeCount",
        },
      },

      // :small_blue_diamond: Add employee count field
      {
        $addFields: {
          totalEmployees: {
            $ifNull: [
              { $arrayElemAt: ["$employeeCount.totalEmployees", 0] },
              0,
            ],
          },
        },
      },

      // :small_blue_diamond: Project fields
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
          totalEmployees: 1,
          adminDetails: {
            _id: "$adminDetails._id",
            name: "$adminDetails.name",
            email: "$adminDetails.email",
            role: "$adminDetails.role",
          },
        },
      },

      // :fire: FACET (All counts handled here correctly)
      {
        $facet: {
          // :white_check_mark: Filtered Data
          data: [
            { $match: dataMatch },
            { $sort: { createdAt: -1 } },
          ],

          // :white_check_mark: Total Companies
          totalCount: [
            { $count: "total" },
          ],

          // :white_check_mark: Active Companies
          activeCount: [
            {
              $match: { status: { $regex: /^active$/i } },
            },
            { $count: "total" },
          ],

          // :white_check_mark: This Month Companies
          thisMonthCount: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: [{ $year: "$createdAt" }, { $year: "$$NOW" }] },
                    { $eq: [{ $month: "$createdAt" }, { $month: "$$NOW" }] },
                  ],
                },
              },
            },
            { $count: "total" },
          ],
        },
      },

      // :small_blue_diamond: Extract values safely (avoid undefined errors)
      {
        $project: {
          data: 1,

          total: {
            $ifNull: [
              { $arrayElemAt: ["$totalCount.total", 0] },
              0,
            ],
          },

          activeCompanies: {
            $ifNull: [
              { $arrayElemAt: ["$activeCount.total", 0] },
              0,
            ],
          },

          thisMonthCompanies: {
            $ifNull: [
              { $arrayElemAt: ["$thisMonthCount.total", 0] },
              0,
            ],
          },

          activationRate: {
            $let: {
              vars: {
                totalVal: {
                  $ifNull: [
                    { $arrayElemAt: ["$totalCount.total", 0] },
                    0,
                  ],
                },
                activeVal: {
                  $ifNull: [
                    { $arrayElemAt: ["$activeCount.total", 0] },
                    0,
                  ],
                },
              },
              in: {
                $cond: [
                  { $eq: ["$$totalVal", 0] },
                  0,
                  {
                    $round: [
                      {
                        $multiply: [
                          { $divide: ["$$activeVal", "$$totalVal"] },
                          100,
                        ],
                      },
                      2,
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    ];

    const result = await companymodel.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      message: "Dashboard data fetched successfully",
      ...result[0], // sends data, total, activeCompanies, etc
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};