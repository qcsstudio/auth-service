const User = require("./models/user.model");
const Company = require("../companies/company.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Attendance = require('./models/attendance.odel.js');
const { getTodayRange, getWeekRange } = require("../../utils/date");
const Event = require('./models/event.model.js');
const { getNextNDaysRange } = require('../../utils/date');
const Employee = require('./models/employee.model.js');
const LeaveRequest = require('./models/leaveRequest.model.js');
const Interview = require('./models/interview.model.js');
const Application = require('./models/application.model.js');


exports.companyAdminLogin = async ({ email, password, companySlug }) => {
  // 1. find company
  const company = await Company.findOne({ slug: companySlug });
  if (!company) throw new Error("invalid company");

  if (company.status !== "ACTIVE") {
    throw new Error("company is not active");
  }

  // 2. find company admin user
  const user = await User.findOne({
    email,
    companyId: company._id,
    role: "COMPANY_ADMIN"
  });

  if (!user) throw new Error("invalid credentials");

  // 3. verify password
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("invalid credentials");

  // 4. force password change
  if (user.mustChangePassword) {
    return {
      forcePasswordChange: true,
      userId: user._id
    };
  }

  // 5. issue jwt
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


exports.changePassword = async ({ userId, oldPassword, newPassword }) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("user not found");

  // check old password
  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) throw new Error("old password incorrect");

  // hash new password
  const hashed = await bcrypt.hash(newPassword, 10);

  user.password = hashed;
  user.mustChangePassword = false;
  await user.save();

  // issue token
  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
      companyId: user.companyId
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return token;
};


exports.totalActiveEmployees = async (companyId) => {
  return Employee.countDocuments({
    companyId,
    status: 'active'
  });
};


exports.todayAttendanceMetrics = async (companyId) => {
  const { today, tomorrow } = getTodayRange();

  const [presentToday, absentToday] = await Promise.all([
    Attendance.countDocuments({
      companyId,
      date: { $gte: today, $lt: tomorrow },
      status: 'present'
    }),
    Attendance.countDocuments({
      companyId,
      date: { $gte: today, $lt: tomorrow },
      status: 'absent'
    })
  ]);

  return { presentToday, absentToday };
};



exports.pendingLeaveRequests = async (companyId) => {
  return LeaveRequest.find({
    companyId,
    status: 'Pending'
  })
    .select(
      '_id employeeId employeeName leaveType startDate endDate reason status createdAt'
    )
    .sort({ createdAt: -1 })
    .lean();
};



exports.weeklyHiringMetrics = async (companyId) => {
  const { start, end } = getWeekRange();

  const [weeklyInterviews, newApplications] = await Promise.all([
    Interview.countDocuments({
      companyId,
      status: 'scheduled',
      scheduledDate: { $gte: start, $lt: end }
    }),
    Application.countDocuments({
      companyId,
      status: 'new',
      appliedDate: { $gte: start, $lt: end }
    })
  ]);

  return { weeklyInterviews, newApplications };
};


exports.upcomingEventsService = async (companyId) => {
  const { start, end } = getNextNDaysRange(30);

  return Event.find({
    companyId,
    eventDate: { $gte: start, $lte: end },
    status: { $ne: 'Cancelled' },
    isActive: true
  })
    .sort({ eventDate: 1 })
    .limit(10)
    .lean();
};
