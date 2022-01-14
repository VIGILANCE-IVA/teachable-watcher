const express = require("express");
const authController = require("./auth.controller");
const catchAsync = require("./catchAsync.middleware");
const authMiddleware = require("./auth.middleware");
const router = express.Router();

router.route("/login").post(catchAsync(authController.login));
router.use(catchAsync(authMiddleware.authenticate));
router.put("/updatePassword", catchAsync(authController.updatePassword));

module.exports = router;
