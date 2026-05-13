const router = require("express").Router();
const controller = require("./superadmin.controller"); // your existing controller
const tenantMiddleware = require("../../middlewares/tenant.middleware"); // detect subdomain
const authMiddleware = require("../../middlewares/auth.middleware"); // protect routes
const { createQuestion,getAllQuestions } = require("../Appraisalcycle/Questioncontroller");
const {createCycle, checkCompanyCycleExists  } = require("../Appraisalcycle/Appraisalcyclecontroller");
/* ===================== LOGIN ===================== */
// Single login endpoint for both SuperAdmin and Company Admin
router.post("/login", tenantMiddleware, controller.login);
router.post("/createQuestions-survey", authMiddleware, createQuestion);
router.post("/SetupSurvey-preception", authMiddleware,createCycle );
router.get("/check-preception", authMiddleware,checkCompanyCycleExists  );
router.get("/all-questions-fetch", authMiddleware, getAllQuestions);



/* ===================== DASHBOARD ===================== */
// Optional: superadmin-only dashboard
router.get("/super-admin/dashboard", authMiddleware, controller.getSuperAdminDashboardData);    
      
module.exports = router;
