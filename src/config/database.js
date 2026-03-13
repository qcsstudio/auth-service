const mongoose = require("mongoose");
const { mongoUri } = require("./env");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI || mongoUri);
  console.log("mongodb connected");
};

module.exports = connectDB;
