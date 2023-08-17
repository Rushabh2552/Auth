const userLogout = async (req, res) => {
  //passport-local-mongoose Method
  await req.logout((err) => {
    if (err) {
      console.error(err);
      return res.redirect("/");
    }
    res.redirect("/");
  });
};

module.exports = { userLogout };
