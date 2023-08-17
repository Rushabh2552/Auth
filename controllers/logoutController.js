const userLogout = (req, res) => {
  //passport-local-mongoose Method
  req.logout((err) => {
    if (err) {
      console.error(err);
      return res.redirect("/");
    }
    res.redirect("/");
  });
};

module.exports = { userLogout };
