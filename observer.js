const { EventEmitter } = require("events");
const { CronJob, CronTime } = require("cron");
const moment = require("moment-timezone");
const xtend = require("xtend");
const axios = require("axios");
const store = require("./store");
const Utils = require("./utils");

class Observer extends EventEmitter {
  constructor(opts = {}) {
    super();
    this.predictions = [];
    this.anomaly = false;
    this.running = false;

    this.defaults = {
      timezone: "Africa/Nairobi",
      watch_interval: 5000,
      prediction_count: 5,
      session_timeout: 60000, // one minute
    };

    this.opts = xtend({}, opts);
  }

  opt(key) {
    return this.opts[key] || this.defaults[key];
  }

  addPredictions(predictions) {
    let time = moment().tz(this.opt("timezone")).format("DD-MM-YYYY HH:mm:ss");

    this.predictions = this.predictions.concat(
      predictions.map((p) => xtend(p, { time }))
    );

    this.emit("predictions", time, predictions);
  }

  start() {
    if (this.running) return;

    axios
      .post(
        this.opts.service,
        xtend(
          {
            delay: 0,
          },
          this.opts.service_data
        )
      )
      .then((response) => {
        let { task_id } = response.data;

        let time = moment()
          .tz(this.opt("timezone"))
          .format("DD-MM-YYYY HH:mm:ss");

        store.setTask(task_id, { status: "running", start_time: time });
        this.running = true;

        this.interval = setInterval(
          () => this.check(),
          this.opts.watch_interval
        );
      })
      .catch(function (error) {
        console.error(error.message);
      });
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.predictions = [];
    this.anomaly = false;
    this.running = false;
    let time = moment().tz(this.opt("timezone")).format("DD-MM-YYYY HH:mm:ss");
    let task_id = store.runningTask();

    axios
      .put(this.opts.service, {
        task_id,
      })
      .then(() => {
        store.setTask(task_id, { status: "stopped", stop_time: time });
      })
      .catch(function (error) {
        console.error(error.message);
      });
  }

  check() {
    if (!this.anomaly) {
      let predictions = this.predictions
        .filter((i) => i.exact)
        .slice(0, this.opt("prediction_count"))
        .filter((i) => i.class === this.opt("anomaly_class"));

      if (predictions.length >= this.opt("prediction_count")) {
        let time = moment()
          .tz(this.opt("timezone"))
          .format("DD-MM-YYYY HH:mm:ss");

        this.emit("anomaly", time, predictions);
        this.anomaly = true;
        setTimeout(() => this.clear(), this.opt("session_timeout"));
      }
    }
  }

  clear() {
    this.predictions = [];
    this.anomaly = false;
  }

  init() {
    const time = store.time();
    let cron = Utils.cronTime(time);

    this.start_job = new CronJob({
      cronTime: cron.start,
      timeZone: this.opt("timezone"),
      onTick: () => this.start(),
    });

    this.stop_job = new CronJob({
      cronTime: cron.stop,
      timeZone: this.opt("timezone"),
      onTick: () => this.stop(),
    });

    this.start_job.start();
    this.stop_job.start();
  }

  cronTime(data) {
    let cron = Utils.cronTime(data);

    if (cron) {
      store.setTime(data);

      let cronTimeStart = new CronTime(cron.start, this.opt("timezone"));
      let cronTimeStop = new CronTime(cron.stop, this.opt("timezone"));

      this.start_job.setTime(cronTimeStart);
      this.stop_job.setTime(cronTimeStop);

      this.start_job.start();
      this.stop_job.start();
    }
  }
}

module.exports = Observer;
