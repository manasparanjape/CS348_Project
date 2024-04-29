const bcrypt = require("bcryptjs");
const { Admins, Members, sequelize } = require("../config/models");
const { Transaction } = require("sequelize");
const utils = require("./utils");

const authenticateMembers = async (Email, Pwd, done) => {
    const transaction = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    try {
        const member = await Members.findOne({ where: { Email: Email }, transaction });
        if (member == null) {
            transaction.commit()
            return done(null, false, { message: 'No member with that email' });
        }
        if (await bcrypt.compare(Pwd, member.Pwd)) {
            member.If_admin = false;
            transaction.commit()
            return done(null, member);
        } else {
            transaction.commit()
            return done(null, false, { message: 'Password incorrect' });
        }
    } catch (e) {
        await transaction.rollback();
        return done(e);
    }
};

const authenticateAdmins = async (Email, Pwd, done) => {
    const transaction = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    try {
        const admin = await Admins.findOne({ where: { Email: Email }, transaction });
        if (admin == null) {
            transaction.commit()
            return done(null, false, { message: 'No admin with that email' });
        }
        if (await bcrypt.compare(Pwd, admin.Pwd)) {
            admin.If_admin = true;
            transaction.commit()
            return done(null, admin);
        } else {
            transaction.commit()
            return done(null, false, { message: 'Password incorrect' });
        }
    } catch (e) {
        await transaction.rollback();
        return done(e);
    }
};

const logout = [utils.authenticate, async (req, res) => {
    try {
        req.logout(function (err) {
            if (err) {
                return next(err);
            }
            res.redirect("/login");
        });
    } catch (e) {
        res.render("/login", { error: "Internal Server Error" });
    }
}];

const changePasswordMember = async (req, res) => {
    const transaction = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ });
    try {
        const member = await Members.findOne({ where: { ID: req.user.ID }, transaction });
        details = req.body;

        if (!await bcrypt.compare(details.Old_pwd, member.Pwd)) {
            render_dict = { message: "Old password is incorrect", user: req.user };

            await transaction.commit();
            res.render("changePassword.ejs", render_dict);
            
            return;
        }

        if (details.New_pwd !== details.Confirmed_pwd) {
            render_dict = { message: "Passwords do not match", user: req.user };

            await transaction.commit();
            res.render("changePassword.ejs", render_dict);
            
            return;
        }

        member.Pwd = await bcrypt.hash(details.New_pwd, 10);

        await member.save({ transaction });

        const books = await utils.getBooksRentedByMember(req.user.ID, transaction);
        render_dict = { user: req.user, message: "Password changed successfully", books: books };

        await transaction.commit();
        res.render("memberHome.ejs", render_dict);
    } catch (error) {
        await transaction.rollback();
        render_dict = { message: "Internal Server Error", user: req.user };
        res.render("memberHome.ejs", render_dict);
    }
};

const changePasswordAdmin = async (req, res) => {
    const transaction = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ });
    try {
        const admin = await Admins.findOne({ where: { ID: req.user.ID }, transaction });
        details = req.body;

        if (!await bcrypt.compare(details.Old_pwd, admin.Pwd)) {
            render_dict = { message: "Old password is incorrect", user: req.user };

            await transaction.commit();
            res.render("changePassword.ejs", render_dict);
            
            return;
        }

        if (details.New_pwd !== details.Confirmed_pwd) {
            render_dict = { message: "Passwords do not match", user: req.user };

            await transaction.commit();
            res.render("changePassword.ejs", render_dict);
            
            return;
        }

        admin.Pwd = await bcrypt.hash(details.New_pwd, 10);

        await admin.save({ transaction });

        render_dict = { message: "Password changed successfully", user: req.user };

        await transaction.commit();
        res.render("adminHome.ejs", render_dict);

    } catch (error) {
        await transaction.rollback();
        render_dict = { message: "Internal Server Error", user: req.user };
        res.render("adminHome.ejs", render_dict);
    }
};

const postChangePassword = [utils.authenticate, async (req, res) => {
    try {
        if (!req.user.dataValues.hasOwnProperty("If_primary")) {
            await changePasswordMember(req, res);
        } else {
            await changePasswordAdmin(req, res);
        }
    } catch (error) {
        await transaction.rollback();
        res.render("/login", { error: "Internal Server Error" });
    }
}];

const postRegister = async (req, res) => {
    const transaction = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE });
    try {
        details = req.body;

        if (details.Pwd !== details.Confirmed_pwd) {
            await transaction.commit();
            res.render("register.ejs", { error: "Password not matching" });
            
            return;
        }
        if (isNaN(details.Phone) || details.Phone.length !== 10) {
            await transaction.commit();
            res.render("register.ejs", { error: "Phone number not valid" });
            return;
        }
        const member = await Members.findOne({ where: { Email: details.Email }, transaction });
        if (member) {
            await transaction.commit();
            res.render("register.ejs", { error: "Email already exists" });
            return;
        }

        delete details.Confirmed_pwd;
        details.Pwd = await bcrypt.hash(details.Pwd, 10);

        const newMember = await Members.create(req.body, { transaction });

        await transaction.commit();
        res.render("login.ejs", { message: "Registration successful" });
        return res;
    } catch (error) {
        await transaction.rollback();
        res.render("register.ejs", { error: "Internal Server Error" });
    }
};

const postNewAdmin = [utils.authenticate, async (req, res) => {
    const transaction = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE });
    try {
        details = req.body;

        const admin = await Admins.findOne({ where: { Email: details.Email }, transaction });
        console.log(admin)

        if (admin != null) {
            await transaction.commit();
            res.render("newAdmin.ejs", { message: "Admin with this email already exists" });
            return;
        }

        details.If_primary = false;
        new_pwd = Math.random().toString(36).slice(-8);
        details.Pwd = await bcrypt.hash(new_pwd, 10);

        const newAdmin = await Admins.create(details, { transaction });

        render_dict = { message: `Admin added successfully. Password is ${new_pwd}`, user: req.user };

        await transaction.commit();
        res.render("adminHome.ejs", render_dict);
    } catch (error) {
        await transaction.rollback();
        res.render("newAdmin.ejs", { message: "Internal Server Error" });
    }
}];

const getMemberHome = [utils.authenticate, async (req, res) => {
    const transaction = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    try {
        const ifMember = await utils.checkIfMember(req, res, transaction);
        if (ifMember) {
            const books = await utils.getBooksRentedByMember(req.user.ID, transaction);
            render_dict = { user: req.user, message: "", books: books };

            await transaction.commit();
            res.render("memberHome.ejs", render_dict);
        }
    } catch (error) {
        await transaction.rollback();
        res.render("login.ejs", { error: "Internal Server Error" });
    }
}];

const getAdminHome = [utils.authenticate, async (req, res) => {
    const transaction = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    try {
        const ifAdmin = await utils.checkIfAdmin(req, res, transaction);
        if (ifAdmin) {
            render_dict = { message: "", user: req.user };

            await transaction.commit();
            res.render("adminHome.ejs", render_dict);
        }
    } catch (error) {
        await transaction.rollback();
        res.render("login.ejs", { error: "Internal Server Error" });
    }
}];

const getLogin = async (req, res) => {
    res.render("login.ejs");
};

const getRegister = async (req, res) => {
    res.render("register.ejs", { error: "" });
};

const getChangePassword = [utils.authenticate, async (req, res) => {
    render_dict = { message: "", user: req.user };
    res.render("changePassword.ejs", render_dict);
}];

const getNewAdmin = [utils.authenticate, async (req, res) => {
    const transaction = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    try {
        const ifAdmin = await utils.checkIfAdmin(req, res, transaction);
        if (ifAdmin) {
            await transaction.commit();
            res.render("newAdmin.ejs", { message: "" });
        }
    } catch (error) {
        await transaction.rollback();
        render_dict = { message: "Internal Server Error", user: req.user };
        res.render("adminHome.ejs", render_dict);
    }
}];

module.exports = {
    authenticateMembers,
    authenticateAdmins,
    logout,
    postChangePassword,
    postNewAdmin,
    postRegister,
    getMemberHome,
    getAdminHome,
    getLogin,
    getRegister,
    getChangePassword,
    getNewAdmin
};
