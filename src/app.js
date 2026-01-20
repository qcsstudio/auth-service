const express = require("express");
const cors = require("cors");

const app = express();

/* CORS CONFIG */
app.use(
  cors({
    origin: "http://localhost:5173", // frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

/* BODY PARSER */
app.use(express.json());

/* ROUTES */
app.use("/auth/superadmin", require("./modules/superadmin/superadmin.routes"));
app.use("/invites", require("./modules/invites/invite.routes"));

app.use("/companies", require("./modules/companies/company.routes"));
app.use("/users", require("./modules/users/user.routes"));

module.exports = app;
