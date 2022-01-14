const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
require("dotenv").config();
const port = process.env.PORT;
const Observer = require("./observer");
const store = require("./store");
const notify = require("./notify");
const cors = require("cors");
const AppError = require("./AppError");
const httpStatus = require("http-status");
const { errorConverter, errorHandler } = require("./error.middleware");
const utils = require("./utils");
const { Server } = require("socket.io");
const moment = require("moment");
const watch = (global.watch = new Observer());
const apiRouter = require("./api.route");

//socket io
const io = (global.io = new Server(server, {
  cors: {
    origin: "*",
  },
  allowRequest: async (req, callback) => {
    let payload = await utils.verifyToken(req.headers["x-access-token"]);
    callback(null, payload);
  },
}));

//get predictions
watch.on("predictions", (time, predictions) => {
  io.emit("predictions", { [time]: predictions });
});

watch.on("anomaly", (time, predictions) => {
  io.emit("anomaly", { [time]: predictions });

  //send notification
  io.emit("notification", {
    title: "Anomaly Alert",
    text: notify.message(),
    titleRightText: moment(time, "DD-MM-YYYY HH:mm:ss").format("hh:mma"),
    closeOnClick: true,
    closeTimeout: 5000,
  });

  //send sms to responsible person
  if (watch.opt("sms_notifications")) {
    notify.sms(time);
  }

  store.setAnomaly(time, predictions);
});

// enable cors
const corsOptions = {
  exposedHeaders: ["X-Access-Token"],
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.disable("x-powered-by");
app.use("/api", apiRouter);

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
      axios
        .post(req.body.webhook, {
          predictions: [
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
          ],
        })
        .catch(console.log);
    }, Number(`${req.body.delay || 1}000`));

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

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new AppError("Not found", httpStatus.NOT_FOUND));
});

// convert error to AppError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

server.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
  watch.init();
});
