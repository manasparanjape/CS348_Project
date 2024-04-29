const express = require("express");
const passport = require('passport');
const authController = require("../controllers/authController");
const LocalStrategy = require('passport-local').Strategy;
const { Admins, Members } = require("../config/models");

const router = express.Router();

passport.use('member', new LocalStrategy({ usernameField: 'email' , passwordField: 'password'}, authController.authenticateMembers))
passport.use('admin', new LocalStrategy({ usernameField: 'email' , passwordField: 'password'}, authController.authenticateAdmins))

passport.serializeUser(function(user, done) {
    done(null, user.Email);
});

passport.deserializeUser(function(email, done) {
    const member = Members.findOne({ where: { Email: email } });
    const admin = Admins.findOne({ where: { Email: email } });

    Promise.all([member, admin])
        .then(([memberResult, adminResult]) => {
            if (memberResult) {
                done(null, memberResult);
            } else if (adminResult) {
                done(null, adminResult);
            } else {
                done(new Error('User not found'));
            }
        })
        .catch(err => done(err));
});

router.post("/memberLogin", passport.authenticate("member", {
    successRedirect: "/memberHome",
    failureRedirect: "/login",
    failureFlash: true
}));
router.post("/adminLogin", passport.authenticate("admin", {
    successRedirect: "/adminHome",
    failureRedirect: "/login",
    failureFlash: true
}));
router.post("/register", authController.postRegister);
router.post("/changePassword", authController.postChangePassword);
router.post("/newAdmin", authController.postNewAdmin);
router.get("/logout", authController.logout);

router.get("/memberHome", authController.getMemberHome);
router.get("/adminHome", authController.getAdminHome);
router.get("/login", authController.getLogin);
router.get("/register", authController.getRegister);
router.get("/changePassword", authController.getChangePassword);
router.get("/newAdmin", authController.getNewAdmin);

module.exports = router;
