const { Books, Loans, Members, sequelize } = require("../config/models");
const Sequelize = require("sequelize");
const utils = require("./utils");


const postMemberSearch = [utils.authenticate, async (req, res) => {
    const transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED });
    try {
        const books = await utils.searchBookByDetails(req.body, transaction);
        
        const loans = await Loans.findAll({ where: { Member_ID: req.user.ID, Date_of_return: null }, transaction });
        var rented_books = [];
        for (let i = 0; i < loans.length; i++) {
            rented_books.push(loans[i].ISBN);
        }
        books.forEach(book => {
            book.Rented = rented_books.includes(book.ISBN);
        });

        render_dict = { user: req.user, books: books };
        await transaction.commit();
        res.render("memberSearch.ejs", render_dict);
    }
    catch (error) {
        await transaction.rollback();
        res.status(500);
        res.statusMessage = 'Internal Server Error';
        res.send("Internal Server Error");
    }
}];

const postRentBook = [utils.authenticate, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const book = await Books.findOne({ where: { ISBN: req.body.ISBN }, transaction });
        if (book.Number_of_copies - book.Loaned_copies <= 0) {
            const books = await utils.getBooksRentedByMember(req.user.ID, transaction);
            render_dict = {name: req.user.Full_name, message: "Book not available", books: books };
            await transaction.commit();
            res.render("memberHome.ejs", render_dict);
            return;
        }
        book.Loaned_copies += 1;
        await book.save({ transaction });
        
        // get current date in UTC

        const loan = { Member_ID: req.user.ID, ISBN: req.body.ISBN, Date_of_issue: new Date() };
        await Loans.create(loan, { transaction });

        const books = await utils.getBooksRentedByMember(req.user.ID, transaction);
        render_dict = { user: req.user, message: "Book rented successfully", books: books };

        await transaction.commit();
        res.render("memberHome.ejs", render_dict);
    }
    catch (error) {
        await transaction.rollback();
        res.render("memberSearch.ejs", {name: req.user.Full_name, error: "Server side error renting book", books: [] });
    }

}];

const postAdminSearchBook = [utils.authenticate, async (req, res) => {
    const transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED });
    try {
        const books = await utils.searchBookByDetails(req.body, transaction);
        render_dict = { books: books };
        await transaction.commit();
        res.render("adminSearch.ejs", render_dict);
    }
    catch (error) {
        await transaction.rollback();
        res.status(500);
        res.statusMessage = 'Internal Server Error';
        res.send("Internal Server Error");
    }
}];

const postAdminSearchMember = [utils.authenticate, async (req, res) => {
    const transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED });
    try {
        const member = await Members.findOne({ where: { Email: req.body.Email }, transaction });
        if (!member) {
            res.render("adminSearchMember.ejs", { error: "Member not found" });
            await transaction.commit();
            return;
        }
        const books = await utils.getBooksRentedByMember(member.ID, transaction);
        
        var total_fine = 0;
        books.forEach(book => {
            total_fine += utils.calculateFine(new Date(book.Due_date));
        });
        member.Total_fines = total_fine;

        render_dict = { member: member, books: books, error: "", message: ""};
        await transaction.commit();
        res.render("adminSearchMember.ejs", render_dict);
    } catch (error) {
        await transaction.rollback();
        res.status(500);
        res.statusMessage = 'Internal Server Error';
        res.send("Internal Server Error");
    }
}];

const postReturnBook = [utils.authenticate, async (req, res) => {
    const transaction = await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED });
    try {
        var loans = await Loans.findOne({ where: { Member_ID: req.body.Member_ID, ISBN: req.body.ISBN }, transaction });
        loans = [loans];
        const loan = loans.find(loan => loan.Date_of_issue === req.body.Date_of_issue);
        
        loan.Date_of_return = new Date();
        await loan.save({ transaction });
        
        const book = await Books.findOne({ where: { ISBN: req.body.ISBN }, transaction });

        book.Loaned_copies -= 1;
        await book.save({ transaction });

        const member = await Members.findOne({ where: { ID: req.body.Member_ID }, transaction });
        const books = await utils.getBooksRentedByMember(member.ID, transaction);
        render_dict = { member: member, books: books, message: "Book returned successfully", error: ""};
        await transaction.commit();
        res.render("adminSearchMember.ejs", render_dict);
    } catch (error) {
        await transaction.rollback();
        res.status(500);
        res.statusMessage = 'Internal Server Error';
        res.send("Internal Server Error");
    }
}];

const postAddBook = [utils.authenticate, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        details = req.body;
        if (isNaN(details.ISBN) || details.ISBN.length !== 13) {
            res.render("addBook.ejs", { error: "ISBN not valid" });
            await transaction.commit();
            return;
        }

        if (details.Year === "") {
            delete details.Year;
        }

        const book = await Books.create(details, { transaction });
        render_dict = { message: "Book added successfully", user: req.user };

        await transaction.commit();
        res.render("adminHome.ejs", render_dict);
    }
    catch (error) {
        await transaction.rollback();
        res.render("addBook.ejs", { error: "Server side error adding book" });
    }
}];

const postEditBook = [utils.authenticate, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        details = req.body;
        const book = await Books.findOne({ where: { ISBN: details.ISBN }, transaction });
        if (!book) {
            res.render("editBook.ejs", { error: "Book not found" })
            await transaction.commit();
            return;
        }
        if (details.Number_of_copies < book.Loaned_copies) {
            res.render("editBook.ejs", { error: "Number of copies cannot be less than number of rented copies" })
            await transaction.commit();
            return;
        }

        book.Number_of_copies = details.Number_of_copies;
        await book.save({ transaction });

        render_dict = { message: "Book edited successfully", user: req.user };
        await transaction.commit();
        res.render("adminHome.ejs", render_dict);
    }
    catch (error) {
        await transaction.rollback();
        res.render("editBook.ejs", { error: "Server side error updating book" })
    }
}];

const postDeleteBook = [utils.authenticate, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        details = req.body;
        const book = await Books.findOne({ where: { ISBN: details.ISBN, Title: details.Title }, transaction });
        if (!book) {
            res.render("deleteBook.ejs", { error: "Book not found" })
            await transaction.commit();
            return;
        }
        if (book.Loaned_copies > 0) {
            res.render("deleteBook.ejs", { error: "Cannot delete book which is currently rented out" })
            await transaction.commit();
            return;
        }
        await book.destroy({ transaction });
        
        render_dict = { message: "Book deleted successfully", user: req.user };
        await transaction.commit();
        res.render("adminHome.ejs", render_dict);
    }
    catch (error) {
        await transaction.rollback();
        res.render("deleteBook.ejs", { error: "Server side error deleting book" })
    }
}];

const getAddBook = [utils.authenticate, async (req, res) => {
    res.render("addBook.ejs", { error: "" });
}];

const getEditBook = [utils.authenticate, async (req, res) => {
    res.render("editBook.ejs", { error: "" });
}];

const getDeleteBook = [utils.authenticate, async (req, res) => {
    res.render("deleteBook.ejs", { error: "" });
}];

module.exports = {
    postMemberSearch,
    postRentBook,
    postAdminSearchBook,
    postAdminSearchMember,
    postReturnBook,
    postAddBook,
    postEditBook,
    postDeleteBook,
    getAddBook,
    getEditBook,
    getDeleteBook
};
