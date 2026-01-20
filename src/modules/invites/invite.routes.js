const router = require("express").Router();
const auth = require("../../middlewares/auth.middleware");
const controller = require("./invite.controller");

router.post("/send-setup-link", auth, controller.sendSetupLink);
router.get("/validate", controller.validateInvite);

module.exports = router;
