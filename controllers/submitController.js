const User = require("../models/User");

const loadSubmitPage = (req, res) => {
  //passport-local-mongoose Method
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
};

const submitSecret = async (req, res) => {
  const submittedSecret = req.body.secret;

  await User.findById(req.user.id)
    .exec()
    .then((foundUser) => {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        return foundUser.save();
      }
    })
    .catch((err) => {
      console.log(err);
    });
  res.redirect("/secrets");
};

module.exports = { loadSubmitPage, submitSecret };
