const router = require("express").Router();
const controller = require("./invite.controller");
const inviteAuth = require("../../middlewares/inviteAuth.middleware");
const uploadToS3 = require("../../middlewares/s3Upload");
const { allowRoles } = require("../../middlewares/role.middleware");



router.post("/send-setup-link", controller.sendSetupLink);
router.post("/validate-otp", controller.validateOtp);

// ✅ these require invite token
router.post("/company-setup", inviteAuth, controller.createCompanyFromInvite);
router.post("/:companyId/admin-setup", inviteAuth, controller.createAdminFromInvite);
router.post("/:companyId/workspace-setup", inviteAuth, controller.setupWorkspaceFromInvite);

router.post(
  "/:companyId/invite-companyBrandingSetup",
 inviteAuth,
  allowRoles("SUPER_ADMIN", "COMPANY_ADMIN"),
  (req, res, next) => {
    uploadToS3("company-branding").fields([
      { name: "brand-logo", maxCount: 1 },
      { name: "cover-image", maxCount: 1 }
    ])(req, res, err => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  controller.inviteUploadCompanyBranding
);      
module.exports = router;
