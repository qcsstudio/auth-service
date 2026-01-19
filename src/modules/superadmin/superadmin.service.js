const SuperAdmin = require("./superadmin.model");
const jwt = require("../../config/jwt");
const bcrypt = require("bcrypt");

exports.login = async (email, password) => {
  const admin = await SuperAdmin.findOne({ email });
  if (!admin) throw new Error("Invalid credentials");

  const match = await bcrypt.compare(password, admin.password);
  if (!match) throw new Error("Invalid credentials");

  const token = jwt.signToken({
    id: admin._id,
    role: "SUPER_ADMIN"
  });

  return { admin, token };
};
