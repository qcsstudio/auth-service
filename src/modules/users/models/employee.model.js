const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    workEmail: {
      type: String,
      required: [true, "Work Email is required"],
      lowercase: true,
      trim: true,
      unique: true
    },

    phone: {
      type: String,
      trim: true
    },

    employeeId: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      enum: [
          "Engineering",
          "Sales",
          "HR",
          "Marketing",
          "Finance",
          "Operations",
          "Management"
        ],
      default: "Engineering",
      required: true, 
    },

    designation: {
      type: String,
      required: true,
      trim: true
    },

    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null
    },

    locationBranch: {
      type: String,
      required: true,
      trim: true
    },

    joinDate: {
      type: Date,
    },

    employeeType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Intern", "Temporary"],
      required: true
    },

    probationEndDate: {
      type: Date,
      default: null
    },

    shift: {
      type: String,
      enum: ["Morning", "Evening", "Night", "Flexible", "Remote"],
      default: "Morning"
    },

    systemRole: {
      type: String,
      enum: ["Manager", "Employee", "Viewer", "HR", "TL"],
      required: true ,
      default: "Employee"
    },
  },
  {
    timestamps: true
  }
);

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;