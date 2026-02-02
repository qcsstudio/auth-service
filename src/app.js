const express = require("express");
const cors = require("cors");

const app = express();

/* ===================== EXACT ALLOWED ORIGINS ===================== */
const allowedExactOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://qcshrms.vercel.app",
  "https://hrms.qcsstudios.com",
  "https://www.qcsstudios.com",
];

/* ===================== ALLOWED SUBDOMAIN PATTERN ===================== */
// Allows: xyz.qcsstudios.com, abc.qcsstudios.com, etc.
const allowedDomainRegex = /\.qcsstudios\.com$/;

/* ===================== CORS CONFIG ===================== */
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow Postman / curl / server-to-server calls
      if (!origin) return callback(null, true);

      // Allow exact origins
      if (allowedExactOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow dynamic tenant subdomains
      try {
        const hostname = new URL(origin).hostname;

        if (allowedDomainRegex.test(hostname)) {
          return callback(null, true);
        }
      } catch (err) {
        console.log("❌ Invalid origin format:", origin);
      }

      console.log("❌ Blocked CORS for origin:", origin);
      return callback(new Error("CORS not allowed"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-invite-token",
    ],
    credentials: true,
  })
);

/* ===================== PRE-FLIGHT HANDLING ===================== */
app.options("*", cors());

/* ===================== BODY PARSER ===================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===================== ROOT TEST ===================== */
app.get("/", (req, res) => {
  res.send("HRMS backend is running 🚀");
});

/* ===================== TENANT IDENTIFICATION ===================== */
app.use(require("./middlewares/tenant.middleware"));

/* ===================== ROUTES ===================== */
app.use("/auth/superadmin", require("./modules/superadmin/superadmin.routes"));
app.use("/invites", require("./modules/invites/invite.routes"));
app.use("/companies", require("./modules/companies/company.routes"));
app.use("/users", require("./modules/users/user.routes"));

/* ===================== ERROR HANDLER ===================== */
app.use((err, req, res, next) => {
  // CORS rejection
  if (err.message === "CORS not allowed") {
    return res.status(403).json({
      error: "CORS blocked: origin not allowed",
    });
  }

  console.error("🔥 Server Error:", err);
  res.status(500).json({
    error: "Something went wrong!",
  });
});

module.exports = app;
