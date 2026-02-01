const express = require("express");
const cors = require("cors");

const app = express();

/* ===================== ALLOWED ORIGINS ===================== */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://qcshrms.vercel.app",
  "https://hrms.qcsstudio.com",
  "https://www.qcsstudios.com", // ✅ LIVE FRONTEND
];

/* ===================== CORS CONFIG ===================== */
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow Postman / server-to-server / curl
      if (!origin) return callback(null, true);

      // Allow listed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ Blocked CORS for origin:", origin);
      return callback(new Error("CORS not allowed"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-invite-token", // ✅ invite flow header
    ],
    credentials: true,
  })
);

/* ===================== BODY PARSER ===================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===================== ROOT TEST ===================== */
app.get("/", (req, res) => {
  res.send("HRMS backend is running 🚀");
});

/* ===================== TENANT MIDDLEWARE ===================== */
app.use(require("./middlewares/tenant.middleware"));

/* ===================== ROUTES ===================== */
app.use("/auth/superadmin", require("./modules/superadmin/superadmin.routes"));
app.use("/invites", require("./modules/invites/invite.routes"));
app.use("/companies", require("./modules/companies/company.routes"));
app.use("/users", require("./modules/users/user.routes"));

/* ===================== ERROR HANDLER ===================== */
app.use((err, req, res, next) => {
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
