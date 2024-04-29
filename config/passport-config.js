const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { authenticateUsers, authenticateAdmins } = require("../controllers/authController");

passport.use('member', new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, authenticateUsers));
passport.use('admin', new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, authenticateAdmins));

passport.serializeUser(function (member, done) {
    done(null, member.Email);
});

passport.deserializeUser(function (email, done) {
    return done(null, Members.findOne({ where: { Email: email } }));
});

module.exports = passport;
