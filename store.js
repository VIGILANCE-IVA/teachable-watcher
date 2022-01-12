const Configstore = require("configstore");
const xtend = require("xtend");
const config = new Configstore("watcher-store");

function Store() {
  this.anomaly_prefix = "anomalies";
  this.tasks_prefix = "tasks";
  this.cron_prefix = "cron_time";
}

Store.prototype.setTime = function (time) {
  config.set(this.cron_prefix, time);
};

Store.prototype.time = function () {
  return xtend(
    {
      start_time: "23:59",
      stop_time: "06:59",
    },
    config.get(this.cron_prefix)
  );
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
