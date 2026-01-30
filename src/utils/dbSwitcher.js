const mongoose = require("mongoose");

const connections = {};

module.exports.getCompanyDB = async (dbName) => {
  if (connections[dbName]) {
    return connections[dbName];
  }

  const uri = `${process.env.MONGO_URI}/${dbName}`;

  const conn = await mongoose.createConnection(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  connections[dbName] = conn;
  return conn;
};
