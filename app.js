const express = require("express");
const app = express();
require("dotenv").config();
const port = process.env.PORT;
const Observer = require("./observer");
const store = require("./store");
const notify = require("./notify");

const watch = new Observer({
  timezone: process.env.TZ,
  anomaly_class: process.env.ANOMALY_CLASS,
  prediction_count: process.env.PREDICTION_COUNT,
  session_timeout: process.env.SESSION_TIMEOUT,
  watch_interval: process.env.WATCH_INTERVAL,
  service: process.env.SERVICE || `http://127.0.0.1:${port}/predictions/video`,
  service_data: {
    video_uri: process.env.VIDEO_URL,
    delay: process.env.DELAY || 1,
    webhook: process.env.WEBHOOK || `http://127.0.0.1:${port}/webhook`,
  },
});

//get predictions
watch.on("predictions", (time, predictions) => {});

watch.on("anomaly", (time, predictions) => {
  console.log("anomaly", time, predictions);
  store.setAnomaly(time, predictions);
  //send sms to responsible person
  notify.sms(watch.opt("anomaly_class"), process.env.SCENE_NAME, time);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.disable("x-powered-by");

app.get("/", (req, res) => {
  res.send("ok");
});

app.get("/anomalies", (req, res) => {
  res.json(store.anomalies());
});

app.get("/tasks", (req, res) => {
  res.json(store.tasks());
});

app
  .route("/cron")
  .get((req, res) => {
    res.json(store.time());
  })
  .post((req, res) => {
    watch.cronTime(req.body);
    res.send("ok");
  });

app.post("/start", (req, res) => {
  watch.stop();
  res.send("ok");
});

app.post("/stop", (req, res) => {
  watch.stop();
  res.send("ok");
});

app.post("/webhook", (req, res) => {
  watch.addPredictions(req.body);
  res.status(200).send("ok");
});

/**
 * <Mocking>
 * ignore!
 * the following routes mocks the detection service
 */

let mock_interval;
let axios = require("axios");

app
  .route("/predictions/video")
  .post((req, res) => {
    mock_interval = setInterval(() => {
      axios.post(req.body.webhook, [
        {
          exact: true,
          class: "something",
          confidence: 1,
        },
        {
          exact: false,
          class: "nothing",
          confidence: 0,
        },
      ]);
    }, Number(`${req.body.delay}000`));

    res.json({
      task_id: 1,
    });
  })
  .put((req, res) => {
    console.log("stopped", req.body);
    clearInterval(mock_interval);
    res.json(req.body);
  });
/**
 * mocking stops here
 * </Mocking>
 * */

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
  watch.init();
});
