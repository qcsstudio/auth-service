const router = require("express").Router();
const authMiddleware = require("../../middlewares/auth.middleware");
const controller = require("./user.controller");

// company admin login
router.post("/company/login", controller.login);
router.post("/change-password", controller.changePassword);
router.get("/company-dashboard",authMiddleware, controller.getCompanyDashboardData);

module.exports = router;
