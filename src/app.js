const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

/* ===================== EXACT ALLOWED ORIGINS ===================== */
const allowedExactOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://qcshrms.vercel.app",
  "https://hrms.qcsstudios.com",
  "https://www.qcsstudios.com",
  "https://demo.qcsstudios.com",
];

/* ===================== ALLOWED SUBDOMAIN PATTERN ===================== */
// Allows any *.qcsstudios.com like xyz.qcsstudios.com
const allowedDomainRegex = /\.qcsstudios\.com$/;

/* ===================== CORS CONFIG ===================== */
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, curl, postman
      if (!origin) return callback(null, true);

      // Exact allowed origins
      if (allowedExactOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow any subdomain *.qcsstudios.com
      try {
        const hostname = new URL(origin).hostname;
        if (allowedDomainRegex.test(hostname)) {
          return callback(null, true);
        }
      } catch (err) {
        console.log("❌ Invalid origin:", origin);
      }

      console.log("❌ CORS blocked for:", origin);
      return callback(new Error("CORS not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-invite-token",
    ],
  })
);

/* ===================== BODY PARSERS ===================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===================== DEBUG ALL ROUTES (TEMP) ===================== */
app.all("*", (req, res, next) => {
  console.log("Hit route:", req.method, req.originalUrl);
  next();
});

/* ===================== TENANT MIDDLEWARE ===================== */
const Company = require("./modules/companies/company.model");

app.use(async (req, res, next) => {
  try {
    // Skip tenant check for global routes
    if (
      req.path.startsWith("/auth/superadmin") ||
      req.path.startsWith("/invites")
    ) {
      req.tenant = null;
      return next();
    }

    const host = req.headers.host;
    if (!host) {
      req.tenant = null;
      return next();
    }

    const cleanHost = host.split(":")[0];

    // Skip non-tenant hosts
    if (
      cleanHost === "localhost" ||
      /^\d+\.\d+\.\d+\.\d+$/.test(cleanHost) ||
      cleanHost === "api.qcsstudios.com" ||
      cleanHost === "www.qcsstudios.com"
    ) {
      req.tenant = null;
      return next();
    }

    const parts = cleanHost.split(".");
    if (parts.length < 3) {
      req.tenant = null;
      return next();
    }

    const subdomain = parts[0];
    const company = await Company.findOne({ slug: subdomain });

    if (!company) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    req.tenant = {
      companyId: company._id,
      slug: company.slug,
      status: company.status,
    };

    next();
  } catch (err) {
    next(err);
  }
});

/* ===================== ROUTES ===================== */
app.use("/auth/superadmin", require("./modules/superadmin/superadmin.routes"));
app.use("/invites", require("./modules/invites/invite.routes"));
app.use("/companies", require("./modules/companies/company.routes"));
app.use("/users", require("./modules/users/user.routes"));

/* ===================== HEALTH CHECK ===================== */
app.get("/", (req, res) => {
  res.send("Auth Service running 🚀");
});

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
    return res.status(403).json({
      error: "CORS blocked: origin not allowed",
    });
  }

  console.error("🔥 Server Error:", err);
  res.status(500).json({
    error: "Something went wrong",
  });
});

module.exports = app;
