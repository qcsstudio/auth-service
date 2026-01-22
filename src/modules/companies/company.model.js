const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },

    country: String,
    timezone: String,
    currency: String,

    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "SUSPENDED"],
      default: "DRAFT"
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    workspace: {
      trial: { type: Boolean, default: false },
      whiteLabel: { type: Boolean, default: false },
      employeeLimit: Number,
      trialEndDate: Date,
      partnerReseller: String,
      companyUrl: { type: String }
    },

    subscription: {
      price: { type: Number, default: 0 },
      isActive: { type: Boolean, default: false },
      startDate: Date,
      endDate: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);
