const router = require("express").Router();
const controller = require("./user.controller");
const tenantMiddleware = require("../../middlewares/tenant.middleware");
// company admin login
router.post("/company/login", controller.login);
router.post("/change-password", controller.changePassword);
router.post("/internal-create", controller.createInternalUser);
router.post("/send-otp", controller.sendOTP);
router.post("/verify-otp", controller.verifyOTP);
router.post("/reset-password", controller.resetPassword);
router.post("/change-password", tenantMiddleware, controller.changePassword);
module.exports = router;
