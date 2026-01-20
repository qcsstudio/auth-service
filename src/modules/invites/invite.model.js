const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    role: {
      type: String,
      enum: ["COMPANY_ADMIN"],
      default: "COMPANY_ADMIN"
    },

    trial: { type: Boolean, default: false },

    expiresAt: { type: Date, required: true },

    token: { type: String, required: true, unique: true },

    used: { type: Boolean, default: false },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invite", inviteSchema);
