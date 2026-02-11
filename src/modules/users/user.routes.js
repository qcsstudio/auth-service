const router = require("express").Router();
const controller = require("./user.controller");

// company admin login
router.post("/company/login", controller.login);
router.post("/change-password", controller.changePassword);
router.post("/internal-create", controller.createInternalUser);

module.exports = router;
