const SuperAdmin = require("./superadmin.model");
const jwt = require("../../config/jwt");
const bcrypt = require("bcrypt");
const companyModel = require("../companies/company.model");


const User = require("../users/user.model");

// 🔐 SUPER ADMIN LOGIN
exports.superAdminLogin = async (email, password) => {
  const admin = await SuperAdmin.findOne({ email });
  if (!admin) throw new Error("Invalid credentials");

  const match = await bcrypt.compare(password, admin.password);
  if (!match) throw new Error("Invalid credentials");

  const token = jwt.signToken({
    id: admin._id,
    role: "SUPER_ADMIN"
  });

  return { user: admin, token };
};
exports.companyAdminLogin = async (email, password, tenant) => {
  const user = await User.findOne({ email, companyId: tenant.companyId }).select("+adminTempPassword");
  if (!user) throw new Error("Invalid credentials");

  let match = false;

  // 1️⃣ Check temporary password first
  if (user.adminTempPassword && password === user.adminTempPassword) {
    match = true;

    // Optional: force password change on first login
    user.password = await bcrypt.hash(password, 10); // save temp password as hashed
    user.adminTempPassword = undefined; // remove temp password
    user.mustChangePassword = true;
    await user.save();
  } else {
    // 2️⃣ Compare against hashed password
    match = await bcrypt.compare(password, user.password);
  }

  if (!match) throw new Error("Invalid credentials");

  const token = jwt.signToken({
    id: user._id,
    role: user.role,
    companyId: tenant.companyId
  });

  return {
    user,
    token,
    forcePasswordChange: user.mustChangePassword
  };
};



// exports.login = async (email, password) => {
//   const admin = await SuperAdmin.findOne({ email });
//   if (!admin) throw new Error("Invalid credentials");

//   const match = await bcrypt.compare(password, admin.password);
//   if (!match) throw new Error("Invalid credentials");

//   const token = jwt.signToken({
//     id: admin._id,
//     role: "SUPER_ADMIN"
//   });

//   return { admin, token };
// };

exports.superAdminDashboardData = async (
  matchStage = {},
  pageNumber = 1,
  pageLimit = 10
) => {
  const [result] = await companyModel.aggregate([
    {
      $facet: {
        totalCompanies: [{ $count: "count" }],

        activeCompanies: [
          { $match: { status: "ACTIVE" } },
          { $count: "count" }
        ],

        trials: [
          {
            $match: {
              "workspace.trial": true,
              "workspace.trialEndDate": { $gte: new Date() }
            }
          },
          { $count: "count" }
        ],

        monthlyRevenue: [
          {
            $match: {
              "subscription.isActive": true
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$subscription.price" }
            }
          }
        ],

        companies: [
          { $match: matchStage },
          { $sort: { createdAt: -1 } },
          { $skip: (pageNumber - 1) * pageLimit },
          { $limit: pageLimit },
          {
            $lookup: {
              from: "users",
              localField: "adminId",
              foreignField: "_id",
              as: "admin"
            }
          },
          {
            $unwind: {
              path: "$admin",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $project: {
              name: 1,
              admin: {
                _id: "$admin._id",
                name: "$admin.name",
                email: "$admin.email"
              },
              status: 1,
              employeeLimit: "$workspace.employeeLimit",
              createdAt: 1
            }
          }
        ],

        totalCompaniesForPagination: [
          { $match: matchStage },
          { $count: "count" }
        ]
      }
    }
  ]);

  return {
    stats: {
      totalCompanies: result.totalCompanies[0]?.count || 0,
      activeCompanies: result.activeCompanies[0]?.count || 0,
      trials: result.trials[0]?.count || 0,
      monthlyRevenue: result.monthlyRevenue[0]?.total || 0
    },
    companies: result.companies,
    pagination: {
      total: result.totalCompaniesForPagination[0]?.count || 0,
      page: pageNumber,
      limit: pageLimit
    }
  };
};
