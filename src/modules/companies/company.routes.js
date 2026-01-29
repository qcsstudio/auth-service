const router = require("express").Router();
const auth = require("../../middlewares/auth.middleware");
const controller = require("./company.controller");
const { uploadExcel } = require("../../middlewares/upload.middleware");

// router.post(
//   "/bulk-upload",
//   auth,
//   uploadExcel.single("file"),
//   controller.bulkUploadCompanyDetails
// );

router.post("/:companyId/add-employee", controller.addEmployee);

// ✅ Bulk upload employees
router.post(
  "/:companyId/bulk-upload-employees",
  auth,
  uploadExcel.single("file"),
  controller.bulkUploadEmployees
);

router.post("/", auth, controller.createCompany);
router.post("/:companyId/admin", auth, controller.createCompanyAdmin);
router.post("/:companyId/workspace", auth, controller.setupWorkspace);

module.exports = router;
