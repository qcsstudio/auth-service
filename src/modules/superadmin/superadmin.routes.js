const router = require("express").Router();
const controller = require("./superadmin.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.post("/login", controller.login);
router.get("/super-admin/dashboard",authMiddleware,controller.getSuperAdminDashboardData);

module.exports = router;
