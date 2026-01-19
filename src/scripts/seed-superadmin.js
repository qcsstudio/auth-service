require("dotenv").config();   // 👈 ADD THIS LINE AT TOP

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const SuperAdmin = require("../modules/superadmin/superadmin.model");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const exists = await SuperAdmin.findOne();
    if (exists) {
      console.log("Super admin already exists");
      process.exit(0);
    }

    const hashed = await bcrypt.hash("Admin@123", 10);

    await SuperAdmin.create({
      email: "superadmin@qcs.com",
      password: hashed
    });

    console.log("Super admin created");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
