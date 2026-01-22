const express = require("express");
const cors = require("cors");
const app = express();

/* ===================== CORS CONFIG ===================== */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://qcshrms.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow server-to-server or Postman requests (no origin)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.log("Blocked CORS for origin:", origin);
        return callback(new Error("CORS not allowed"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // include OPTIONS for preflight
    allowedHeaders: ["Content-Type", "Authorization"], // allow JWT headers
    credentials: true, // allow cookies
  })
);

/* ===================== BODY PARSER ===================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===================== ROUTES ===================== */
app.use("/auth/superadmin", require("./modules/superadmin/superadmin.routes"));
app.use("/invites", require("./modules/invites/invite.routes"));
app.use("/companies", require("./modules/companies/company.routes"));
app.use("/users", require("./modules/users/user.routes"));

/* ===================== ERROR HANDLING ===================== */
app.use((err, req, res, next) => {
  if (err.message === "CORS not allowed") {
    return res.status(403).json({ error: "CORS blocked: origin not allowed" });
  }
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

module.exports = app;
