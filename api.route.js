const express = require("express");
const router = express.Router();
const catchAsync = require("./catchAsync.middleware");
const apiController = require("./api.controller");
const authRoute = require("./auth.route");
const authMiddleware = require("./auth.middleware");

router.use("/auth", authRoute);
router.use(catchAsync(authMiddleware.authenticate));

router
  .route("/cfg")
  .get(catchAsync(apiController.cfg))
  .post(catchAsync(apiController.setCfg));

router.get("/anomalies", catchAsync(apiController.anomalies));
router.get("/tasks", catchAsync(apiController.tasks));
router.post("/cron", catchAsync(apiController.cron));
router.get("/status", catchAsync(apiController.status));
router.post("/start", catchAsync(apiController.start));
router.post("/stop", catchAsync(apiController.stop));
router.post("/webhook", catchAsync(apiController.webhook));

module.exports = router;
