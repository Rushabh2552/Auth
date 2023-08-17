const User = require("../models/User");
const ejs = require("ejs");

const loadSecrets = async (req, res) => {
  await User.find({ secret: { $ne: null } })
    .then((foundUsers) => {
      if (foundUsers) {
        res.render("secrets", { usersWithSecrets: foundUsers });
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

module.exports = { loadSecrets };
