const express = require("express");
const bookController = require("../controllers/bookController");

const router = express.Router();

router.post("/memberSearch", bookController.postMemberSearch);
router.post("/rentBook", bookController.postRentBook);
router.post("/adminSearchBook", bookController.postAdminSearchBook);
router.post("/adminSearchMember", bookController.postAdminSearchMember);
router.post("/returnBook", bookController.postReturnBook);
router.post("/addBook", bookController.postAddBook);
router.post("/editBook", bookController.postEditBook);
router.post("/deleteBook", bookController.postDeleteBook);

router.get("/addBook", bookController.getAddBook);
router.get("/editBook", bookController.getEditBook);
router.get("/deleteBook", bookController.getDeleteBook);


module.exports = router;
