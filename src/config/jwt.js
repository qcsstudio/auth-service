const jwt = require("jsonwebtoken");
const { jwtSecret, jwtExpiresIn } = require("./env");

exports.signToken = (payload) => {
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
};

exports.verifyToken = (token) => {
  return jwt.verify(token, jwtSecret);
};
