const Configstore = require("configstore");
const xtend = require("xtend");
const config = new Configstore("watcher-store");
const _ = require("lodash");
const utils = require("./utils");

function Store() {
  this.anomaly_prefix = "anomalies";
  this.tasks_prefix = "tasks";
  this.configs = "configs";
  this.admins = "admins";
}

Store.prototype.updateAdmin = function (username, data) {
  let admin = this.admin(username);
  config.delete(`${this.admins}.${username}`);
  config.set(`${this.admins}.${data.username}`, xtend(admin, data));
};

Store.prototype.resetAdmin = function (username) {
  config.delete(`${this.admins}.${username}`);
};

Store.prototype.admin = function (username) {
  return config.get(`${this.admins}.${username}`);
};

Store.prototype.admins = function () {
  return this.all(this.admins);
};

Store.prototype.config = function (key) {
  let cfg = xtend(
    {
      cron: {
        run: _.defaultTo(process.env.CRON_RUN, false),
        start_time: _.defaultTo(process.env.START_TIME, "23:59"),
        stop_time: _.defaultTo(process.env.STOP_TIME, "06:59"),
      },
      sms_notifications: _.defaultTo(process.env.SMS_NOTIFICATIONS, false),
      scene: _.defaultTo(process.env.SCENE_NAME, "[SCENE NAME]"),
      timezone: _.defaultTo(process.env.TZ, "Africa/Nairobi"),
      anomaly_class: _.defaultTo(process.env.ANOMALY_CLASS, undefined),
      prediction_count: _.defaultTo(process.env.PREDICTION_COUNT, 5),
      session_timeout: _.defaultTo(process.env.SESSION_TIMEOUT, 60000), // one minute
      watch_interval: _.defaultTo(process.env.WATCH_INTERVAL, 5000),
      service: _.defaultTo(
        process.env.SERVICE,
        `http://127.0.0.1:${process.env.PORT}/predictions/video`
      ),
      notification_phone_number: _.defaultTo(process.env.MOBILE_PHONE, 0),
      alert_message: _.defaultTo(
        process.env.ALERT_MESSAGE,
        `VIGILANCE IVA\nThere is a %{class_name} at the %{scene}.\n%{time}`
      ),
      softphone_key: _.defaultTo(process.env.SOFTPHONE_KEY, ""),
      service_data: {
        video_uri: _.defaultTo(process.env.VIDEO_URL, 0),
        delay: _.defaultTo(process.env.DELAY, 0),
        webhook: `${_.defaultTo(
          process.env.WEBHOOK,
          `http://127.0.0.1:${process.env.PORT}/api/webhook`
        )}?X-Access-Token=${utils.generateAuthToken({
          webhook: true,
        })}`,
      },
    },
    config.get(this.configs)
  );

  return key ? cfg[key] : cfg;
};

Store.prototype.setConfig = function (data) {
  let cfg = xtend(this.config(), data);
  config.set(this.configs, cfg);
};

Store.prototype.setTime = function (time) {
  this.setConfig({ cron: time });
};

Store.prototype.setAnomaly = function (time, predictions) {
  config.set(`${this.anomaly_prefix}.${time}`, predictions);
};

Store.prototype.anomalies = function () {
  return xtend(config.get(this.anomaly_prefix), {});
};

Store.prototype.setTask = function (task, data) {
  config.set(`${this.tasks_prefix}.${task}`, data);
};

Store.prototype.tasks = function () {
  return xtend(config.get(this.tasks_prefix), {});
};

Store.prototype.runningTask = function () {
  let task = this.all(this.tasks_prefix).find((t) => t.status == "running");
  return task ? task.key : null;
};

Store.prototype.all = function (prefix) {
  let values = config.get(prefix);
  let output = [];

  if (values) {
    Object.keys(values).forEach((key) => {
      output.push(xtend(values[key], { key }));
    });
  }
  return output;
};

module.exports = new Store();
