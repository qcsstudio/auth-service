const app = require("./app");
const connectDB = require("./config/database");
const { port } = require("./config/env");

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`auth service running on ${port}`);
  });
});
