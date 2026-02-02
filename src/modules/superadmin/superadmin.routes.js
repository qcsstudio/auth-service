const router = require("express").Router();
const controller = require("./auth.controller");
const tenantMiddleware = require("../../middlewares/tenant.middleware");

// Apply tenant middleware to all login routes
router.post("/superadmin/login", tenantMiddleware, controller.login);
router.post("/login", tenantMiddleware, controller.login); // for company admins

module.exports = router;
