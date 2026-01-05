const SuperAdmin = require("./superadmin.model");
const { comparePassword } = require("../../utils/hash");
const jwt = require("../../config/jwt");

exports.login = async (email, password) => {
  const admin = await SuperAdmin.findOne({ email });
  if (!admin) throw new Error("Invalid credentials");

  const match = await comparePassword(password, admin.password);
  if (!match) throw new Error("Invalid credentials");

  const token = jwt.signToken({
    id: admin._id,
    role: "SUPER_ADMIN"
  });

  return { admin, token };
};
