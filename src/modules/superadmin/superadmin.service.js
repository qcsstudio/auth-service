const SuperAdmin = require("./superadmin.model");
const jwt = require("../../config/jwt");
const bcrypt = require("bcrypt");
const companyModel = require("../companies/company.model");

exports.login = async (email, password) => {
  const admin = await SuperAdmin.findOne({ email });
  if (!admin) throw new Error("Invalid credentials");

  const match = await bcrypt.compare(password, admin.password);
  if (!match) throw new Error("Invalid credentials");

  const token = jwt.signToken({
    id: admin._id,
    role: "SUPER_ADMIN"
  });

  return { admin, token };
};

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
