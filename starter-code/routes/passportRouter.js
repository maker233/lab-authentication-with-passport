const express = require("express");
const passportRouter = express.Router();
// Require user model
const User = require('../models/user')
    // Add bcrypt to encrypt passwords

const bcrypt = require("bcrypt");
const bcryptSalt = 10;

// Add passport 
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const ensureLogin = require("connect-ensure-login");

app.use(session({
    secret: "our-passport-local-strategy-app",
    resave: true,
    saveUninitialized: true
}));

passport.serializeUser((user, cb) => {
    cb(null, user._id);
});

passport.deserializeUser((id, cb) => {
    User.findById(id, (err, user) => {
        if (err) { return cb(err); }
        cb(null, user);
    });
});

passport.use(new LocalStrategy((username, password, next) => {
    User.findOne({ username }, (err, user) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return next(null, false, { message: "Incorrect username" });
        }
        if (!bcrypt.compareSync(password, user.password)) {
            return next(null, false, { message: "Incorrect password" });
        }

        return next(null, user);
    });
}));

app.use(passport.initialize());
app.use(passport.session());


passportRouter.get("/private-page", ensureLogin.ensureLoggedIn(), (req, res) => {
    res.render("passport/private", { user: req.user });
});

passportRouter.get("/signup", (req, res) => {
    res.render("passport/signup");


});

passportRouter.post("/signup", (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    if (username === "" || password === "") {
        res.render("auth/signup", { message: "Indicate username and password" });
        return;
    }

    User.findOne({ username })
        .then(user => {
            if (user !== null) {
                res.render("auth/signup", { message: "The username already exists" });
                return;
            }

            const salt = bcrypt.genSaltSync(bcryptSalt);
            const hashPass = bcrypt.hashSync(password, salt);

            const newUser = new User({
                username,
                password: hashPass
            });

            newUser.save((err) => {
                if (err) {
                    res.render("passport/signup", { message: "Something went wrong" });
                } else {
                    res.redirect("/");
                }
            });
        })
        .catch(error => {
            next(error)
        })
});

module.exports = passportRouter;