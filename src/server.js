const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env")
});

const app = require("./app");
const connectDB = require("./config/database");
const { port } = require("./config/env");

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`auth service running on ${port}`);
    console.log("MONGO_URI =", process.env.MONGO_URI);
    console.log("FRONTEND_URL =", process.env.FRONTEND_URL);
  });
});
