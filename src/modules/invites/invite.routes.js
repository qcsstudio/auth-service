const router = require("express").Router();
const controller = require("./invite.controller");
const inviteAuth = require("../../middlewares/inviteAuth.middleware");

router.post("/send-setup-link", controller.sendSetupLink);
router.post("/validate-otp", controller.validateOtp);

// ✅ these require invite token
router.post("/company-setup", inviteAuth, controller.createCompanyFromInvite);
router.post("/:companyId/admin-setup", inviteAuth, controller.createAdminFromInvite);
router.post("/:companyId/workspace-setup", inviteAuth, controller.setupWorkspaceFromInvite);

module.exports = router;
