const router = require("express").Router();
const auth = require("../../middlewares/auth.middleware");
const controller = require("./company.controller");
const { allowRoles } = require("../../middlewares/role.middleware");
const uploadToS3 = require("../../middlewares/s3Upload");
const { uploadExcel } = require("../../middlewares/upload.middleware");

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

router.post(
  "/:companyId/bulk-upload-employees",
  auth,
  uploadExcel.single("file"),
  controller.bulkUploadEmployees
);


/* ===============================
   BRANDING
================================ */

router.post(
  "/:companyId/company-brandlogoandimage",
  auth,
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
  controller.uploadCompanyBranding
);


module.exports = router;
