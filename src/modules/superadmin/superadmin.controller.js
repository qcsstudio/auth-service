const service = require("./superadmin.service");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "email and password required" });

    const { admin, token } = await service.login(email, password);

    res.json({
      message: "login successful",
      token,
      user: {
        id: admin._id,
        email: admin.email,
        role: "SUPER_ADMIN"
      }
    });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};
