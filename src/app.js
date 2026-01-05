const express = require("express");
const app = express();

app.use(express.json());

app.use("/auth/superadmin", require("./modules/superadmin/superadmin.routes"));

app.use("/companies", require("./modules/companies/company.routes"));


module.exports = app;
