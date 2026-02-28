const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    customUrl: { type: String, required: true, unique: true },

    industryType: String,
    country: String,
    timezone: String,
    currency: String,

    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "SUSPENDED", "COMPLETED", "PAUSED"],
      default: "ACTIVE",
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    branding: {
      logo: String,
      loginImage: String,
    },

    workspace: {
      trial: Boolean,
      whiteLabel: Boolean,
      employeeLimit: Number,
      trialEndDate: Date,
      partnerReseller: String,
      companyUrl: String,
    },

    subscription: {
      price: { type: Number, default: 0 },
      isActive: { type: Boolean, default: false },
      startDate: Date,
      endDate: Date,
    },

    welcomeTitle: String,
    welcomeMessage: String,

    leaveCycleStartMonth: {
      type: String,
      default: null,
    },

    callingCode: {
      type: String,
      default: null,
    },

    financialYearStartMonth: {
      type: String,
      default: null,
    },

    dateFormat: {
      type: String,
      default: null,
    },

    timeFormat: {
      type: String,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperAdmin",
      required: false,
    },
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model("Company", companySchema);