const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: {
      type: String,
      unique: true,
      required: true
    },
    contact: String,
    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["SUPER_ADMIN", "COMPANY_ADMIN"],
      required: true
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company"
    },

    mustChangePassword: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
