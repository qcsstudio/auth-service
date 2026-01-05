const router = require("express").Router();
const controller = require("./superadmin.controller");

router.post("/login", controller.login);

module.exports = router;
