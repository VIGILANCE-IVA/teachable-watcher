const { EventEmitter } = require("events");
const { CronJob, CronTime } = require("cron");
const moment = require("moment-timezone");
const xtend = require("xtend");
const axios = require("axios");
const store = require("./store");
const Utils = require("./utils");
const _ = require("lodash");

class Observer extends EventEmitter {
  constructor() {
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
  }

  opt(key) {
    return store.config(key) || this.defaults[key];
  }

  addPredictions(predictions) {
    let time = moment().tz(this.opt("timezone")).format("DD-MM-YYYY HH:mm:ss");

    this.predictions = this.predictions.concat(
      predictions.map((p) => xtend(p, { time }))
    );

    this.emit("predictions", time, predictions);
  }

  start() {
    return new Promise((resolve, reject) => {
      if (this.running) return resolve();
      axios
        .post(
          this.opt("service"),
          xtend(
            {
              delay: 0,
            },
            this.opt("service_data")
          )
        )
        .then((response) => {
          let { task_id } = response.data;

          let time = moment()
            .tz(this.opt("timezone"))
            .format("DD-MM-YYYY HH:mm:ss");

          store.setTask(task_id, { status: "running", start_time: time });
          this.daemon();
          resolve();
        })
        .catch(reject);
    });
  }

  stop() {
    return new Promise((resolve, reject) => {
      if (this.interval) clearInterval(this.interval);
      this.predictions = [];
      this.anomaly = false;
      this.running = false;
      let time = moment()
        .tz(this.opt("timezone"))
        .format("DD-MM-YYYY HH:mm:ss");
      let task_id = store.runningTask();

      axios
        .put(this.opt("service"), {
          task_id,
        })
        .then(() => {
          store.setTask(task_id, { status: "stopped", stop_time: time });
          resolve();
        })
        .catch(reject);
    });
  }

  check() {
    if (!this.anomaly) {
      let predictions = this.predictions
        .filter((i) => i.exact)
        .slice(0, this.opt("prediction_count"))
        .filter((i) => `${i.class}` === `${this.opt("anomaly_class")}`);

      if (predictions.length >= Number(this.opt("prediction_count"))) {
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

  daemon() {
    this.running = true;
    this.interval = setInterval(() => this.check(), this.opt("watch_interval"));
  }

  restart() {
    if (this.start_job) this.start_job.stop();
    if (this.stop_job) this.stop_job.stop();
    if (this.interval) clearInterval(this.interval);

    if (this.running) {
      this.clear();
      this.daemon();
      this.cronTime();
      return;
    }

    this.init();
  }

  init() {
    let cron = Utils.cronTime(this.opt("cron"));

    this.start_job = new CronJob({
      cronTime: cron.start,
      timeZone: this.opt("timezone"),
      onTick: async () => await this.start(),
    });

    this.stop_job = new CronJob({
      cronTime: cron.stop,
      timeZone: this.opt("timezone"),
      onTick: async () => await this.stop(),
    });

    this.start_job.start();
    this.stop_job.start();
  }

  cronTime(data) {
    let cron = Utils.cronTime(_.defaultTo(data, this.opt("cron")));

    if (cron) {
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
