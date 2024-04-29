const { Books, Loans } = require("../config/models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

const authenticate = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.redirect("/login");
    }
    next();
};

const checkIfMember = async (req, res) => {
    if (req.user.dataValues.hasOwnProperty("If_primary")) {
        render_dict = { message: "You are not authorized to view this page", user: req.user };
        res.render("adminHome.ejs", render_dict);
        return false;
    }
    return true;
};

const checkIfAdmin = async (req, res, transaction) => {
    if (!req.user.dataValues.hasOwnProperty("If_primary")) {
        const books = await getBooksRentedByMember(req.user.ID, transaction);    
        render_dict = {user: req.user, message: "You are not authorized to view that page", books: books };
        res.render("memberHome", render_dict);
        return false;
    }
    return true;
};

const setBookAvailability = (books) => {
    books.forEach(book => {
        book.Available = (book.Number_of_copies - book.Loaned_copies) <= 0 ? "Not available" : "Available";
    });
};

const searchBookByDetails = async (details, transaction) => {
    if (details.Year_min === "") {
        details.Year_min = 0;
    }
    if (details.Year_max === "") {
        details.Year_max = 9999;
    }
    const books = await Books.findAll({
        where: {
            Title: { [Op.like]: `%${details.Title}%` }, 
            Author: { 
                [Op.or]: [
                    { [Op.is]: null }, 
                    { [Op.like]: `%${details.Author}%` }
                ]
            }, 
            Genre: { 
                [Op.or]: [
                    { [Op.is]: null }, 
                    { [Op.like]: `%${details.Genre}%` }
                ]
            }, 
            Year: { 
                [Op.or]: [
                    { [Op.is]: null },
                    { [Op.between]: [details.Year_min, details.Year_max] }
                ]
            },
            Language: { 
                [Op.or]: [
                    { [Op.is]: null }, 
                    { [Op.like]: `%${details.Language}%` }
                ]
            },
        },
        transaction: transaction
    });
    setBookAvailability(books);
    return books;
};

const getBooksRentedByMember = async (Member_ID, transaction) => {
    var loans = await Loans.findAll({ where: { Member_ID: Member_ID, Date_of_return: null }, transaction: transaction });
    var books = [];
    for (let i = 0; i < loans.length; i++) {
        const book = await Books.findOne({ where: { ISBN: loans[i].ISBN }, transaction: transaction });
        var due_date = new Date(loans[i].Date_of_issue);
        due_date.setDate(due_date.getDate() + 14);
        due_date.setHours(0, 0, 0, 0);
        book.Due_date = due_date.toDateString();
        book.Date_of_issue = loans[i].Date_of_issue

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (today > due_date) {
            const diffTime = Math.abs(today - due_date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            book.Fine = diffDays * 2;
        } else {
            book.Fine = 0;
        }
        
        books.push(book);
    }
    return books;
};

const calculateFine = (due_date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (today > due_date) {
        const diffTime = Math.abs(today - due_date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays * 2;
    } else {
        return 0;
    }
};

module.exports = {
    authenticate,
    checkIfMember,
    checkIfAdmin,
    searchBookByDetails,
    getBooksRentedByMember,
    calculateFine
};
