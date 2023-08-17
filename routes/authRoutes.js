const express = require("express");
const router = express.Router();
const loginLimiter = require("../middleware/loginLimiter");
const authController = require("../controllers/authController");

router
  .route("/")
  .get(authController.loadLoginPage)
  .post(loginLimiter, authController.userLogin);

module.exports = router;
