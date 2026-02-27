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
  enum: [
    "SUPER_ADMIN",
    "COMPANY_ADMIN",
    "HR",
    "TL",
    "EMPLOYEE"
  ],
  required: true
},
resetOTP: String,
    resetOTPExpire: Date,
    isOTPVerified: {
      type: Boolean,
      default: false,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company"
    },
istemporyPassword:{
      type:Boolean,
      default:false
    },
    mustChangePassword: {
      type: Boolean,
      default: false
    },

    // 🔥 ADD THESE
    adminTempPassword: {
      type: String,
      select: false
    },

    isWelcomeEmailSent: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
