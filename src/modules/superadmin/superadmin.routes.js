const router = require("express").Router();
const controller = require("./superadmin.controller"); // your existing controller
const tenantMiddleware = require("../../middlewares/tenant.middleware"); // detect subdomain
     
const authMiddleware = require("../../middlewares/auth.middleware"); // protect routes
/* ===================== LOGIN ===================== */
// Single login endpoint for both SuperAdmin and Company Admin
router.post("/login", tenantMiddleware, controller.login);
/* ===================== DASHBOARD ===================== */
// Optional: superadmin-only dashboard
router.get("/super-admin/dashboard", authMiddleware, controller.getSuperAdminDashboardData);    

module.exports = router;
