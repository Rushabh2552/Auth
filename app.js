require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const GitHubStrategy = require("passport-github").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();
const port = 4000;
const url = process.env.MONGODB_URI;

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

//express-session package
app.use(
  session({
    secret: "Yeah! this is a secret.",
    resave: false,
    saveUninitialized: false,
    // cookie: { secure: true },
  })
);

//passport
app.use(passport.initialize());
app.use(passport.session());

// mongoose.connect(url);
mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String,
  githubId: String,
  secret: String,
});

//To hash or salt our password and to users to mongodb
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

//passport cookie
passport.use(User.createStrategy());

//Local storing
// passport.serializeUser(User.serializeUser()); //creates cookie
// passport.deserializeUser(User.deserializeUser()); //using cookie

//hybrid storing
passport.serializeUser((user, cb) => {
  process.nextTick(() => {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser((user, cb) => {
  process.nextTick(() => {
    return cb(null, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:4000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    (accessToken, refreshToken, profile, cb) => {
      User.findOrCreate({ googleId: profile.id }, (err, user) => {
        return cb(err, user);
      });
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "http://localhost:4000/auth/facebook/secrets",
      profileFields: ["id", "displayName", "email"],
    },
    (accessToken, refreshToken, profile, cb) => {
      User.findOrCreate({ facebookId: profile.id }, (err, user) => {
        return cb(err, user);
      });
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "http://localhost:4000/auth/github/secrets",
    },
    (accessToken, refreshToken, profile, cb) => {
      User.findOrCreate({ githubId: profile.id }, (err, user) => {
        return cb(err, user);
      });
    }
  )
);

app.get("/", (req, res) => {
  res.render("home");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

app.get(
  "/auth/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

app.get(
  "/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

app.get("/auth/github", passport.authenticate("github", { scope: ["email"] }));

app.get(
  "/auth/github/secrets",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => res.render("register"));

app.get("/secrets", (req, res) => {
  User.find({ secret: { $ne: null } })
    .then((foundUsers) => {
      if (foundUsers) {
        res.render("secrets", { usersWithSecrets: foundUsers });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", (req, res) => {
  const submittedSecret = req.body.secret;

  User.findById(req.user.id)
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
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
      return res.redirect("/");
    }
    res.redirect("/");
  });
});

app.post("/register", (req, res) => {
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
});

//not a secured way manually
app.post("/login", (req, res) => {
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
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
