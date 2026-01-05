const mongoose = require("mongoose");

const superAdminSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("SuperAdmin", superAdminSchema);
