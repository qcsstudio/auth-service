const express = require("express");
const cors = require("cors");

const app = express();

/* ===================== CORS ===================== */
const allowedExactOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://qcshrms.vercel.app",
  "https://hrms.qcsstudios.com",
  "https://www.qcsstudios.com",
  "https://demo.qcsstudios.com",
];
const allowedDomainRegex = /\.qcsstudios\.com$/;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Postman / curl
    if (allowedExactOrigins.includes(origin)) return callback(null, true);
    try {
      const hostname = new URL(origin).hostname;
      if (allowedDomainRegex.test(hostname)) return callback(null, true);
    } catch (err) {
      console.log("❌ Invalid origin:", origin);
    }
    return callback(new Error("CORS not allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-invite-token"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===================== DEBUG LOG ===================== */
app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.originalUrl, "Host:", req.headers.host);
  next();
});

/* ===================== ROUTES ===================== */
app.use("/auth", require("./modules/auth/auth.routes")); // handles superadmin & admin
app.use("/invites", require("./modules/invites/invite.routes"));
app.use("/companies", require("./modules/companies/company.routes"));
app.use("/users", require("./modules/users/user.routes"));

/* ===================== 404 HANDLER ===================== */
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

/* ===================== ERROR HANDLER ===================== */
app.use((err, req, res, next) => {
  if (err.message === "CORS not allowed") {
    return res.status(403).json({ error: "CORS blocked: origin not allowed" });
  }
  console.error("🔥 Server Error:", err);
  res.status(500).json({ error: "Something went wrong" });
});

module.exports = app;
