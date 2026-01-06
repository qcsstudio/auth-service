const router = require("express").Router();
const auth = require("../../middlewares/auth.middleware");
const controller = require("./company.controller");

router.post("/", auth, controller.createCompany);
router.post("/:companyId/admin", auth, controller.createCompanyAdmin);
router.post("/:companyId/workspace", auth, controller.setupWorkspace);

module.exports = router;
