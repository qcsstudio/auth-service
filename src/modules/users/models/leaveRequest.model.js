const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  leaveType: {
    type: String,
    enum: ['Annual', 'Sick', 'Personal', 'Maternity', 'Paternity'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  approvalDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const LeaveRequest = mongoose.model('LeaveRequest', leaveSchema);

module.exports = LeaveRequest;
