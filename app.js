require("dotenv").config();
require("express-async-errors");
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const connectDB = require("./config/dbConn");
const { logger } = require("./middleware/logger");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const GitHubStrategy = require("passport-github").Strategy;
const { logEvents } = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 4000;

//app.use(logger);  //[production]

app.use(cors(corsOptions));

console.log(process.env.NODE_ENV);

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

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

// Database connection
connectDB();

//User Schema
const User = require("./models/User");

//passport cookie
passport.use(User.createStrategy());

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
      callbackURL: process.env.GOOGLE_CALLBACKURL,
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
      callbackURL: process.env.FACEBOOK_CALLBACKURL,
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
      callbackURL: PROCESS.ENV.GITHUB_CALLBACKURL,
    },
    (accessToken, refreshToken, profile, cb) => {
      User.findOrCreate({ githubId: profile.id }, (err, user) => {
        return cb(err, user);
      });
    }
  )
);

app.use("/", require("./routes/root"));

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

app.use("/register", require("./routes/registerRoutes"));
app.use("/login", require("./routes/authRoutes"));
app.use("/secrets", require("./routes/secretsRoutes"));
app.use("/submit", require("./routes/submitRoutes"));
app.use("/logout", require("./routes/logoutRoutes"));

app.all("*", (req, res) => {
  res.status(404);
  res.render("404");
});

app.use(errorHandler);

mongoose.connection.once("open", () => {
  console.log("connected to mongoDB");
  app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
});

mongoose.connection.on("error", (err) => {
  console.log(err);
  logEvents(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    "mongoErrLog.log"
  );
});
