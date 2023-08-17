const express = require("express");
const router = express.Router();
const submitController = require("../controllers/submitController");

router
  .route("/")
  .get(submitController.loadSubmitPage)
  .post(submitController.submitSecret);

module.exports = router;
