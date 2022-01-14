const AppError = require("./AppError");
const httpStatus = require("http-status");
const utils = require("./utils");

/**
 * Authentication middleware
 *
 * @version 1.0.0
 * @throws AppError 401 if no/wrong token passed
 * @author Koodeyo
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @description takes user token to authenticate user
 * @summary User Authentication
 */
exports.authenticate = async (req, res, next) => {
  // getting token and check if it is there
  let token = req.header("X-Access-Token") || req.query["X-Access-Token"];

  if (!token) {
    return next(new AppError("Please log in.", httpStatus.UNAUTHORIZED));
  }

  // verification token
  let payload = await utils.verifyToken(token);

  if (!payload) {
    return next(
      new AppError(
        "Session expired! Please log out, then log in again!",
        httpStatus.UNAUTHORIZED
      )
    );
  }

  req.user = payload;
  next();
};
