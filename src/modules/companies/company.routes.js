const router = require("express").Router();
const auth = require("../../middlewares/auth.middleware");
const controller = require("./company.controller");

/* step 1 */
router.post("/", auth, controller.createCompany);

/* step 2 */
router.post("/:companyId/admin",auth,controller.createCompanyAdmin);

/* STEP 3 — workspace setup */
router.post("/:companyId/workspace", auth, controller.setupWorkspace);

module.exports = router;
