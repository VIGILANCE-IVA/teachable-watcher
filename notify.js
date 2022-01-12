const axios = require("axios");
const moment = require("moment");

function template(class_name, scene, time) {
  let formatted_time = moment(time, "DD-MM-YYYY HH:mm:ss").format("hh:mma");

  return (
    process.env.ALERT_MESSAGE ||
    `There is a %{class_name} at the %{scene}.\n%{time}`
  )
    .replace(/%{class_name}/g, class_name)
    .replace(/%{scene}/g, scene)
    .replace(/%{time}/g, formatted_time);
}

exports.sms = function (
  class_name,
  scene = "[SCENE NAME]",
  time,
  phone = process.env.MOBILE_PHONE
) {
  let message = template(class_name, scene, time);

  axios
    .post(
      `https://sms.koodeyo.com/api/v1/sms?apiKey=${process.env.SOFTPHONE_KEY}`,
      {
        to: phone,
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
