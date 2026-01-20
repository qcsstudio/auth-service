const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    department: {
      type: String,
      enum: ['Engineering', 'Sales', 'HR', 'Marketing', 'Finance'],
      required: true
    },

    position: {
      type: String,
      required: true
    },

    joinDate: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'on-leave'],
      default: 'active',
      index: true
    },

    salary: {
      type: Number,
      select: false   // security best practice
    },

    phone: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;