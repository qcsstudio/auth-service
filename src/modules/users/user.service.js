const User = require("./models/user.model");
const Company = require("../companies/company.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Attendance = require("./models/attendance.model.js");
const Event = require("./models/event.model.js");
const Employee = require("./models/employee.model.js");
const LeaveRequest = require("./models/leaveRequest.model.js");
const Interview = require("./models/interview.model.js");
const Application = require("./models/application.model.js");

const { getTodayRange, getWeekRange, getNextNDaysRange } = require("../../utils/date");



/* ================= COMPANY ADMIN LOGIN ================= */

exports.companyAdminLogin = async ({ email, password, companySlug }) => {

  const company = await Company.findOne({ slug: companySlug });
  if (!company) throw new Error("invalid company");

  if (company.status !== "ACTIVE") {
    throw new Error("company is not active");
  }

  const user = await User.findOne({
    email,
    companyId: company._id,
    role: "COMPANY_ADMIN"
  });

  if (!user) throw new Error("invalid credentials");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("invalid credentials");

  if (user.mustChangePassword) {
    return {
      forcePasswordChange: true,
      userId: user._id
    };
  }

  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
      companyId: company._id
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return {
    token,
    user
  };
};



/* ================= CHANGE PASSWORD ================= */

exports.changePassword = async ({ userId, newPassword, confirmPassword, tenant }) => {

  if (newPassword !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  const user = await User.findOne({
    _id: userId,
    companyId: tenant.companyId
  }).select("+adminTempPassword");

  if (!user) throw new Error("User not found");

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashedPassword;
  user.mustChangePassword = false;
  user.istemporyPassword = true;
  user.adminTempPassword = undefined;

  await user.save();

  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
      companyId: user.companyId
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return { user, token };
};



/* ================= TOTAL ACTIVE EMPLOYEES ================= */

exports.totalActiveEmployees = async (companyId) => {
  return Employee.countDocuments({
    companyId,
    status: "active"
  });
};



/* ================= TODAY ATTENDANCE ================= */

exports.todayAttendanceMetrics = async (companyId) => {

  const { today, tomorrow } = getTodayRange();

  const [presentToday, absentToday] = await Promise.all([
    Attendance.countDocuments({
      companyId,
      date: { $gte: today, $lt: tomorrow },
      status: "present"
    }),
    Attendance.countDocuments({
      companyId,
      date: { $gte: today, $lt: tomorrow },
      status: "absent"
    })
  ]);

  return { presentToday, absentToday };
};



/* ================= PENDING LEAVE REQUESTS ================= */

exports.pendingLeaveRequests = async (companyId) => {
  return LeaveRequest.find({
    companyId,
    status: "Pending"
  })
    .select(
      "_id employeeId employeeName leaveType startDate endDate reason status createdAt"
    )
    .sort({ createdAt: -1 })
    .lean();
};



/* ================= WEEKLY HIRING ================= */

exports.weeklyHiringMetrics = async (companyId) => {

  const { start, end } = getWeekRange();

  const [weeklyInterviews, newApplications] = await Promise.all([
    Interview.countDocuments({
      companyId,
      status: "scheduled",
      scheduledDate: { $gte: start, $lt: end }
    }),
    Application.countDocuments({
      companyId,
      status: "new",
      appliedDate: { $gte: start, $lt: end }
    })
  ]);

  return { weeklyInterviews, newApplications };
};



/* ================= UPCOMING EVENTS ================= */

exports.upcomingEventsService = async (companyId) => {

  const { start, end } = getNextNDaysRange(30);

  return Event.find({
    companyId,
    eventDate: { $gte: start, $lte: end },
    status: { $ne: "Cancelled" },
    isActive: true
  })
    .sort({ eventDate: 1 })
    .limit(10)
    .lean();
};