const passport = require("passport");
const User = require("../models/User");

const loadRegisterPage = (req, res) => {
  res.render("register");
};

const userRegister = (req, res) => {
  //passport-local-mongoose Method
  User.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets");
        });
      }
    }
  );
};

module.exports = { loadRegisterPage, userRegister };
