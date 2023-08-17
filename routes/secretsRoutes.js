const express = require("express");
const router = express.Router();
const secretController = require("../controllers/secretController");

router.route("/").get(secretController.loadSecrets);

module.exports = router;
