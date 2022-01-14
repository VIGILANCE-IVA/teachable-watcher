const constants = require("./constants");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { promisify } = require("util");

exports.cronTime = function cronTime(data) {
  if (!data.start_time && !data.start_time) {
    return;
  }

  let start_time = data.start_time.split(":");
  let stop_time = data.stop_time.split(":");

  return {
    start: `${start_time[1]} ${start_time[0]} * * *`,
    stop: `${stop_time[1]} ${stop_time[0]} * * *`,
  };
};

exports.generateAuthToken = function generateAuthToken(user) {
  return jwt.sign(user, constants.SECRET_KEY, {
    expiresIn: "30 days",
  });
};

exports.checkPassword = async function checkPassword(password, hashedPassword) {
  const isPasswordMatch = await bcrypt.compare(password, hashedPassword);
  return isPasswordMatch;
};

exports.verifyToken = async function verifyToken(token) {
  try {
    return await promisify(jwt.verify)(token, constants.SECRET_KEY);
  } catch (er) {
    return;
  }
};
