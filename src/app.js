const express = require("express");
const cors = require("cors");

const app = express();

/* ===================== EXACT ALLOWED ORIGINS ===================== */
const allowedExactOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://qcshrms.vercel.app",
  "https://qcsssss.qcsstudios.com",
];

/* ===================== ALLOWED SUBDOMAIN PATTERN ===================== */
const allowedDomainRegex = /\.qcsstudios\.com$/;

/* ===================== CORS ===================== */
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman / curl

      if (allowedExactOrigins.includes(origin)) return callback(null, true);

      try {
        const hostname = new URL(origin).hostname;
        if (allowedDomainRegex.test(hostname)) return callback(null, true);
      } catch (err) {
        console.log("❌ Invalid origin:", origin);
      }

      console.log("❌ CORS blocked:", origin);
      return callback(new Error("CORS not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
allowedHeaders: ["Content-Type", "Authorization", "x-invite-token", "x-tenant"],
  })
);

/* ===================== BODY PARSERS ===================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===================== DEBUG ===================== */
app.use((req, res, next) => {
  console.log(req.method, req.originalUrl);
  next();
});

/* ===================== ROUTES ===================== */
app.use("/auth", require("./modules/superadmin/superadmin.routes"));
app.use("/invites", require("./modules/invites/invite.routes"));
app.use("/companies", require("./modules/companies/company.routes"));
app.use("/users", require("./modules/users/user.routes"));

/* ===================== HEALTH ===================== */
app.get("/", (req, res) => {
  res.json({ status: "API is running 🚀" });
});

/* ===================== 404 ===================== */
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

/* ===================== ERROR ===================== */
app.use((err, req, res, next) => {
  if (err.message === "CORS not allowed") {
    return res.status(403).json({ error: "CORS blocked" });
  }
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

module.exports = app;
