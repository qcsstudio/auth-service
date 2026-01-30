// superAdminOnly middleware
exports.superAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Forbidden: Superadmin only" });
  }

  next();
};
