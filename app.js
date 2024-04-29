if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("express-flash");
const passport = require("passport");
const authRouter = require("./routes/authRouter");
const bookRouter = require("./routes/bookRouter");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("public"));

app.use((req, res, next) => {
    if (req.user instanceof Promise) {
        req.user.then(user => {
            req.user = user;
            next();
        }).catch(next);
    } else {
        next();
    }
});

// only include this when creating db from scratch
const { Admins } = require("./config/models");
Admins.count().then(val => {
    if (val === 0) {
        const bcrypt = require("bcryptjs");
        details = {
            Full_name: "Manas Paranjape",
            Phone: "5027092033",
            Email: "mparanja@purdue.edu",
            Address: "Purdue University",
            Date_of_birth: "2003-08-29",
            Date_of_joining: Date.now(),
            If_primary: true,
            Pwd: bcrypt.hashSync("password", 10)
        };
        const admin = Admins.create(details);
    }
});
// only include this when creating db from scratch

app.use(authRouter);
app.use(bookRouter);

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
