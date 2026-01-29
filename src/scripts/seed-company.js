// ============================================
// DUMMY DATA GENERATOR (scripts/generateDummyData.js)
// ============================================

const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const Company = require("../modules/companies/company.model")
const User = require("../modules/users/models/user.model"); // Assume User model exists

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/dashboard"
    );
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Helper functions
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
};

const getRandomStatus = () => {
  const statuses = ["DRAFT", "ACTIVE", "SUSPENDED"];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

const getRandomCountry = () => {
  const countries = [
    "India",
    "USA",
    "UK",
    "Canada",
    "Australia",
    "Germany",
    "France",
    "Japan",
    "Singapore",
    "UAE"
  ];
  return countries[Math.floor(Math.random() * countries.length)];
};

const getRandomCurrency = () => {
  const currencies = ["INR", "USD", "GBP", "EUR", "AUD", "CAD", "JPY", "SGD", "AED"];
  return currencies[Math.floor(Math.random() * currencies.length)];
};

const getRandomTimezone = () => {
  const timezones = [
    "IST",
    "EST",
    "PST",
    "GMT",
    "CET",
    "JST",
    "AEST",
    "SGT",
    "GST"
  ];
  return timezones[Math.floor(Math.random() * timezones.length)];
};

const getRandomEmail = (name) => {
  const domains = ["gmail.com", "company.com", "email.com", "business.com"];
  const namePart = name.toLowerCase().replace(/\s+/g, ".");
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${namePart}@${domain}`;
};

const getRandomDate = (daysBack = 365) => {
  const now = new Date();
  const random = Math.floor(Math.random() * daysBack);
  return new Date(now.getTime() - random * 24 * 60 * 60 * 1000);
};

const getRandomPrice = () => {
  return Math.floor(Math.random() * (5000 - 100 + 1)) + 100;
};

// Generate dummy companies
const generateDummyCompanies = async (count = 50) => {
  try {
    console.log(`\n📊 Starting to generate ${count} dummy companies...`);

    // Clear existing data (optional)
    const confirmDelete = true; // Set to false if you don't want to delete existing data
    if (confirmDelete) {
      await Company.deleteMany({});
      console.log("✅ Cleared existing companies");
    }

    const companies = [];

    // Sample company names
    const companyNames = [
      "TechVision Solutions",
      "Digital Innovation Hub",
      "CloudNine Systems",
      "DataFlow Analytics",
      "SecureNet Technologies",
      "NextGen Robotics",
      "AI Powerhouse",
      "Quantum Computing Inc",
      "BioTech Innovations",
      "GreenEnergy Solutions",
      "SmartCity Developers",
      "FinTech Pioneers",
      "Blockchain Labs",
      "IoT Enterprises",
      "WebScale Technologies",
      "MobileFirst Apps",
      "CyberSecurity Pro",
      "CloudStorage Plus",
      "DevOps Masters",
      "API Gateway Solutions"
    ];

    for (let i = 0; i < count; i++) {
      // Get or create random admin
      let adminId = null;
      if (Math.random() > 0.3) {
        // 70% companies have admin
        const adminEmail = getRandomEmail(`admin${i}`);
        const adminUser = await User.findOneAndUpdate(
          { email: adminEmail },
          {
            email: adminEmail,
            name: `Admin User ${i}`,
            role: "ADMIN"
          },
          { upsert: true, new: true }
        );
        adminId = adminUser._id;
      }

      const companyName =
        companyNames[i % companyNames.length] + ` ${i + 1}`;

      // Decide if subscription should be active
      const isSubscriptionActive =
        Math.random() > 0.4 && getRandomStatus() === "ACTIVE";

      const startDate = getRandomDate();
      const endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);

      const company = {
        name: companyName,
        slug: generateSlug(companyName),
        country: getRandomCountry(),
        timezone: getRandomTimezone(),
        currency: getRandomCurrency(),
        status: getRandomStatus(),
        adminId: adminId,
        workspace: {
          trial: Math.random() > 0.7, // 30% on trial
          whiteLabel: Math.random() > 0.8, // 20% white label
          employeeLimit: Math.floor(Math.random() * 500) + 10,
          trialEndDate: Math.random() > 0.7 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
          partnerReseller: Math.random() > 0.85 ? `Partner ${i}` : null,
          companyUrl: `https://${generateSlug(companyName)}.com`
        },
        subscription: {
          price: isSubscriptionActive ? getRandomPrice() : 0,
          isActive: isSubscriptionActive,
          startDate: isSubscriptionActive ? startDate : null,
          endDate: isSubscriptionActive ? endDate : null
        }
      };

      companies.push(company);
    }

    // Insert all companies
    const insertedCompanies = await Company.insertMany(companies);
    console.log(`✅ Successfully created ${insertedCompanies.length} companies`);

    // Show statistics
    const stats = await Company.aggregate([
      {
        $facet: {
          totalCompanies: [{ $count: "count" }],
          activeCompanies: [
            { $match: { status: "ACTIVE" } },
            { $count: "count" }
          ],
          trialsCount: [
            { $match: { "workspace.trial": true } },
            { $count: "count" }
          ],
          activeSubscriptions: [
            { $match: { "subscription.isActive": true } },
            { $count: "count" }
          ],
          totalRevenue: [
            { $match: { "subscription.isActive": true } },
            {
              $group: {
                _id: null,
                total: { $sum: "$subscription.price" }
              }
            }
          ]
        }
      }
    ]);

    console.log("\n📈 STATISTICS:");
    console.log(
      `Total Companies: ${stats[0].totalCompanies[0]?.count || 0}`
    );
    console.log(
      `Active Companies: ${stats[0].activeCompanies[0]?.count || 0}`
    );
    console.log(`Trial Companies: ${stats[0].trialsCount[0]?.count || 0}`);
    console.log(
      `Active Subscriptions: ${stats[0].activeSubscriptions[0]?.count || 0}`
    );
    console.log(
      `Total Annual Revenue: $${stats[0].totalRevenue[0]?.total || 0}`
    );

    // Show sample data
    console.log("\n📋 SAMPLE COMPANIES:");
    const samples = await Company.find().limit(3).populate("adminId", "name email");
    console.log(JSON.stringify(samples, null, 2));

    return insertedCompanies;
  } catch (error) {
    console.error("Error generating dummy data:", error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();

    // Generate 50 dummy companies (change number as needed)
    await generateDummyCompanies(50);

    console.log("\n✨ Dummy data generation completed!");
    process.exit(0);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
};

// Run the script
main();

// ============================================
// ADDITIONAL HELPER SCRIPT
// To delete all data and start fresh
// ============================================

/*

// Uncomment to use this function separately

const deleteAllData = async () => {
  try {
    await connectDB();
    await Company.deleteMany({});
    await User.deleteMany({});
    console.log("✅ All data deleted");
    process.exit(0);
  } catch (error) {
    console.error("Error deleting data:", error);
    process.exit(1);
  }
};

deleteAllData();

*/