const _ = require("lodash");

module.exports = Object.freeze({
  SECRET_KEY: _.defaultTo(
    process.env.SECRET_KEY,
    "dsW7UoHqhl1FnQJmXm75NgpGb8243z7s"
  ),
  login: {
    username: _.defaultTo(process.env.LOGIN_USERNAME, "admin"),
    password: _.defaultTo(process.env.LOGIN_PASSWORD, "admin"),
  },
});
