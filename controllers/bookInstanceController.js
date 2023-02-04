const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');
const async = require('async');
const { body, validationResult } = require('express-validator');
const bookinstance = require('../models/bookinstance');

// display list of all book instances
exports.bookinstance_list = (req, res, next) => {
  BookInstance.find()
    .populate("book")
    .exec((err, list_bookinstances) => {
      if (err) {
        return next(err);
      }
      res.render("bookinstance_list", {
        title: "Book Instance List",
        bookinstance_list: list_bookinstances,
      })
    })
}

// display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res, next) => {
  const batch = [];
  async.waterfall(
    [
      function bookI(callback) {
        BookInstance.findById(req.params.id)
          .populate("book")
          .exec(callback);
      },
      function author(results, callback) {
        batch.push(results);
        Book.findById(results.book._id)
          .populate("author") 
          .exec(callback)
      }
    ],
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (batch[0] == null) {
        const err = new Error("Book copy not found!");
        err.status = 404;
        return next(err);
      }
      if (results.author == null) {
        console.log('Problem fetching author')
      }
      console.log([results.author.url, batch[0]])
      res.render("bookinstance_detail", { title: `Copy: ${results.title}`, bookinstance: batch[0], author: results.author })
    })
}

// display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res, next) => {
  Book.find({}, "title").exec((err, books) => {
    if (err) {
      return next(err);
    }
    res.render("bookinstance_form", { title: "Create Book Copy", book_list: books });
  })
}

// handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // validate and sanitize fields
  body("book", "Book must be specified.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("imprint", "Imprint must be specified.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  // process request after validate and sanitize
  (req, res, next) => {
    // extract errors
    const errors = validationResult(req);
    // create book instance obj w/ clean data
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    })
    if (!errors.isEmpty()) {
      // there are errors; render form w/ data in fields and error messages
      Book.find({}, "title").exec(function (err, books) {
        if (err) {
          return next(err);
        }
        res.render("bookinstance_form", { 
          title: "Create Book Copy",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance,
        });
       });
       return;
    }
    // data from form is valid
    bookinstance.save((err) => {
      if (err) {
        return next(err);
      }
      // save successful; redirect to new book copy page
      res.redirect(bookinstance.url);
    })
  }
]

// display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec((err, instance) => {
      if (err) {
        return next(err);
      }
      res.render("bookinstance_delete", { title: "Delete Book Copy", instance })
    })
}

// handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res, next) => {
  BookInstance.findByIdAndRemove(req.body.id).exec((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/catalog/bookinstances");
  })
}

// display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res, next) => {
  async.parallel(
    {
      instance(callback) {
        BookInstance.findById(req.params.id)
          .populate("book")
          .exec(callback);
      },
      books(callback) {
        Book.find(callback);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.instance == null) {
        const err = new Error("Book copy not found.")
        err.status = 404;
        return next(err);
      }
      res.render("bookinstance_form", { 
        title: "Update Book Copy",
        book_list: results.books, 
        selected_book: results.instance.book._id, 
        bookinstance: results.instance, 
      });
    }
  )
}

// handle bookinstance update on POST.
exports.bookinstance_update_post = [
  body("book", "Book must be specified.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("imprint", "Imprint must be specified.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  // extract errors  
  (req, res, next) => {
    const errors = validationResult(req);

    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      due_back: req.body.due_back,
      status: req.body.status,
      _id: req.params.id,
    })
    if (!errors.isEmpty()) {
      Book.find({}, "title").exec((err, books) => {
        if (err) {
          return next(err);
        }
        res.render("bookinstance_form", {
          title: "Update Book Copy",
          book_list: books,
          selected_book: bookinstance._id,
          bookinstance,
          errors: errors.array(),
        })
      })
      return;
    }
    BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {},
      (err, instance) => {
        if (err) {
          return next(err);
        }
        res.redirect(instance.url);
      })
  }
]