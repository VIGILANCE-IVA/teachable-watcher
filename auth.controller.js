const httpStatus = require("http-status");
const AppError = require("./AppError");
const constants = require("./constants");
const utils = require("./utils");
const xtend = require("xtend");
const store = require("./store");
const bcrypt = require("bcrypt");

const createTokenAndSend = (user, res) => {
  // generate auth token and set X-Access-Token header with the token
  const token = utils.generateAuthToken(user);
  res.setHeader("X-Access-Token", token);
  // send user and the token
  return res.status(200).json(
    xtend(
      {
        token: token,
      },
      user
    )
  );
};

exports.login = async (req, res, next) => {
  const { username, password } = req.body;
  let admin = store.admin(username);

  if (admin) {
    const isMatch = await utils.checkPassword(`${password}`, admin.password);
    if (isMatch) {
      return createTokenAndSend({}, res);
    }
  }

  if (
    !admin &&
    username === constants.login.username &&
    password === constants.login.password
  ) {
    return createTokenAndSend({}, res);
  }

  return next(new AppError("Incorrect password!", httpStatus.UNAUTHORIZED));
};

exports.updatePassword = async (req, res, next) => {
  const { currentPassword, password, passwordConfirm } = req.body;
  if (!req.user) {
    return next(
      new AppError(
        "Please Authenticate first",
        httpStatus.INTERNAL_SERVER_ERROR
      )
    );
  }

  // get user with a password
  if (password !== passwordConfirm) {
    return next(
      new AppError("Please confirm your password", httpStatus.BAD_REQUEST)
    );
  }

  let admin = store.admin(constants.login.username);
  let hasMatched;

  if (admin) {
    hasMatched = await utils.checkPassword(currentPassword, admin.password);
  } else {
    hasMatched = currentPassword === constants.login.password;
  }

  if (hasMatched) {
    store.updateAdmin(constants.login.username, {
      username: constants.login.username,
      password: await bcrypt.hash(password, 8),
    });

    return createTokenAndSend({}, res);
  }

  return next(new AppError("Incorrect password!", httpStatus.UNAUTHORIZED));
};
