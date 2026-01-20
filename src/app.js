const express = require("express");
const cors = require("cors");

const app = express();

/* CORS CONFIG */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://qcshrms.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow Postman / server-to-server calls
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
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
