const router = require("express").Router();
const auth = require("../../middlewares/auth.middleware");
const controller = require("./company.controller");
const { allowRoles } = require("../../middlewares/role.middleware");
const uploadToS3 = require("../../middlewares/s3Upload");

/* ===============================
   COMPANY CREATION
================================ */

// SuperAdmin creates company
router.post(
  "/",
  auth,
  allowRoles("SUPER_ADMIN"),
  controller.createCompany
);

// Create company admin (SuperAdmin flow)
router.post(
  "/:companyId/admin",
  auth,
  allowRoles("SUPER_ADMIN"),
  controller.createCompanyAdmin
);

// Workspace setup (Invite flow)
router.post(
  "/:companyId/workspace",
  controller.setupWorkspace
);


/* ===============================
   BRANDING
================================ */

// Upload brand logo
router.post(
  "/:companyId/branding/logo",
  auth,
  allowRoles("SUPER_ADMIN", "COMPANY_ADMIN"),
  (req, res, next) => {
    uploadToS3("brand-logo").single("file")(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  controller.uploadBrandLogo
);

// Upload login image
router.post(
  "/:companyId/branding/login-image",
  auth,
  allowRoles("SUPER_ADMIN", "COMPANY_ADMIN"),
  uploadToS3("login-image").single("file"),
  controller.uploadLoginImage
);

module.exports = router;
