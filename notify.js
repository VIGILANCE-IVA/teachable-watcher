const axios = require("axios");
const moment = require("moment");
const store = require("./store");

exports.message = (time) => {
  return store
    .config("alert_message")
    .replace(/%{class_name}/g, store.config("anomaly_class"))
    .replace(/%{scene}/g, store.config("scene"))
    .replace(
      /%{time}/g,
      time ? moment(time, "DD-MM-YYYY HH:mm:ss").format("hh:mma") : ""
    );
};

exports.sms = function (time) {
  let phone = store.config("notification_phone_number");
  let message = exports.message(time);

  axios
    .post(
      `https://sms.koodeyo.com/api/v1/sms?apiKey=${store.config(
        "softphone_key"
      )}`,
      {
        to: phone.replace(/\s/, "").split(","),
        message,
      }
    )
    .then(function (response) {
      console.log("soft-phone", response.data);
    })
    .catch(function (error) {
      console.debug(
        "soft-phone",
        error.response ? error.response.data : error.message
      );
    });
};
