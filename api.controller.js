const store = require("./store");
const _ = require("lodash");

exports.webhook = (req, res) => {
  let predictions = _.defaultTo(req.body.predictions, []);
  global.watch.addPredictions(predictions);
  res.status(200).send("ok");
};

exports.status = (req, res) => {
  res.json({ running: global.watch.running });
};

exports.start = (req, res) => {
  global.watch.start();
  res.send("ok");
};

exports.stop = (req, res) => {
  global.watch.stop();
  res.send("ok");
};

exports.cron = (req, res) => {
  global.watch.cronTime(req.body);
  res.send("ok");
};

exports.cfg = (req, res) => {
  res.json(store.config());
};

exports.setCfg = (req, res) => {
  store.setConfig(req.body);
  global.watch.restart();
  res.send("ok");
};

exports.anomalies = (req, res) => {
  res.json(store.anomalies());
};

exports.tasks = (req, res) => {
  res.json(store.tasks());
};
