const passport = require("passport");
const User = require("../models/User");

const loadLoginPage = (req, res) => {
  res.render("login");
};

const userLogin = (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  // passport login method -- req.login()
  req.login(user, (err) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secrets");
      });
    }
  });
};

module.exports = { loadLoginPage, userLogin };
