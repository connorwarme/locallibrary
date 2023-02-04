const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");
const async = require('async');
const { body, validationResult } = require('express-validator');

exports.index = (req, res) => {
  async.parallel(
    {
      book_count(callback) {
        Book.countDocuments({}, callback);
      },
      book_instance_count(callback) {
        BookInstance.countDocuments({}, callback);
      },
      book_instance_available_count(callback) {
        BookInstance.countDocuments({ status: "Available" }, callback);
      },
      author_count(callback) {
        Author.countDocuments({}, callback);
      },
      genre_count(callback) {
        Genre.countDocuments({}, callback);
      },
    },
    (err, results) => {
      res.render("index", {
        title: "Local Library Home",
        error: err,
        data: results,
      });
    }
  )
}

// display list of all books.
exports.book_list = (req, res, next) => {
  Book.find({}, "title author")
    .sort({ title: 1 })
    .populate("author")
    .exec((err, list_books) => {
      if (err) {
        return next(err);
      }
      res.render("book_list", { title: "Book List", book_list: list_books})
    })
}

// display detail page for a specific book.
exports.book_detail = (req, res) => {
  async.parallel(
  {
    book(callback) {
      Book.findById(req.params.id)
        .populate("author")
        .populate("genre")
        .exec(callback);
    }, 
    book_instance(callback) {
      BookInstance.find({ book: req.params.id }).exec(callback);
    }
  },
  (err, results) => {
    if (err) {
      return next(err);
    }
    if (results.book == null) {
      const err = new Error("Book not found!");
      err.status = 404;
      return next(err);
    }
    res.render("book_detail", { 
      title: results.book.title,
      book: results.book,
      book_instances: results.book_instance,
    });
  }
  )
}

// display book create form on GET.
exports.book_create_get = (req, res, next) => {
  // get all authors and genres, to use for adding to book
  async.parallel(
    {
      authors(callback) {
        Author.find(callback);
      },
      genres(callback) {
        Genre.find(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      res.render("book_form", { title: "Add Book", authors: results.authors, genres: results.genres });
    }
  )
}

// handle book create on POST.
exports.book_create_post = [
  // convert the genre to an array
  (req, res, next) => {
    if(!Array.isArray(req.body.genre)) {
      req.body.genre = typeof req.body.genre === "undefined" ? [] : [req.body.genre];
    }
    next();
  },
  // validate and sanitize fields
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("genre.*").escape(),

  // process req after validate and sanitize
  (req, res, next) => {
    // extract the validation errors from a req
    const errors = validationResult(req);

    // create a book obj w/ clean data
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    })

    if (!errors.isEmpty()) {
      // there are errors; render form again w/ values and error messages
      async.parallel(
        {
          authors(callback) {
            Author.find(callback);
          },
          genres(callback) {
            Genre.find(callback);
          },
        },
        (err, results) => {
          if (err) {
            return next(err);
          }
          // mark our selected genres as checked
          for (const genre of results.genres) {
            if (book.genre.includes(genre._id)) {
              genre.checked = "true";
            }
          }
          res.render("book_form", {
            title: "Add Book",
            authors: results.authors,
            genres: results.genres,
            book,
            errors: errors.array(),
          })
        }
      );
      return;
    }

    // data from form is valid; save book
    book.save((err) => {
      if (err) {
        return next(err);
      }
      // success: redirect to new book
      res.redirect(book.url);
    })
  }
]

// display book delete form on GET.
exports.book_delete_get = (req, res, next) => {
  async.parallel(
    {
      book(callback) {
        Book.findById(req.params.id)
          .populate("author")
          .populate("genre")
          .exec(callback);
      },
      bookinstances(callback) {
        BookInstance.find({ book: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.book == null) {
        res.redirect("/catalog/books");
      }
      res.render("book_delete", {
        title: "Delete Book",
        book: results.book,
        instances: results.bookinstances,
      });
    }
  )
}

// handle book delete on POST.
exports.book_delete_post = (req, res, next) => {
  async.parallel(
    {
      book(callback) {
        Book.findById(req.body.id)
        .populate("author")
        .populate("genre")
        .exec(callback);
      },
      bookinstances(callback) {
        BookInstance.find({ book: req.body.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.bookinstances.length > 0) {
        res.redirect("book_delete", {
          title: "Delete Book",
          book: results.book,
          instance: results.bookinstances,
        });
        return;
      }
      Book.findByIdAndRemove(req.body.id, (err) => {
        if (err) {
          return next(err);
        }
        res.redirect("/catalog/books");
      });
    }
  )
}

// display book update form on GET.
exports.book_update_get = (req, res, next) => {
  async.parallel(
    {
      book(callback) {
        Book.findById(req.params.id)
          .populate("author")
          .populate("genre")
          .exec(callback);
      },
      authors(callback) {
        Author.find(callback);
      },
      genres(callback) {
        Genre.find(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.book == null) {
        const err = new Error("Book not found!")
        err.status = 404;
        return next(err);
      }
      for (const genre of results.genres) {
        for (const bookGenre of results.book.genre) {
          if (genre._id.toString() === bookGenre._id.toString()) {
            genre.checked = "true";
          }
        }
      }
      res.render("book_form", {
        title: "Update Book",
        authors: results.authors,
        genres: results.genres,
        book: results.book,
      });
    }
  )
}

// handle book update on POST.
exports.book_update_post = [
  // convert the genre to an array
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre = typeof req.body.genre === "undefined" ? [] : [req.body.genre];
    }
    next();
  },
  // validate and sanitize user inputs
  body("title", "Title field must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summar must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("genre.*").escape(),

  // process req after validate and sanitize
  (req, res, next) => {
    const errors = validationResult(req);

    // create book obj w/ clean data and old id
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: typeof req.body.genre === "undefined" ? [] : [req.body.genre],
      _id: req.params.id,
    });
    
    if (!errors.isEmpty()) {
      // there are errors; render form again w/ clean values and error messages
      async.parallel(
        {
          authors(callback) {
            Author.find(callback);
          },
          genres(callback) {
            Genre.find(callback);
          },
        },
        (err, results) => {
          if (err) {
            return next(err);
          }
          
          // mark selected genres as checked
          for (const genre of results.genres) {
            if (book.genre.includes(genre._id)) {
              genre.checked = "true";
            }
          }
          res.render("book_form", {
            title: "Update Book",
            authors: results.authors,
            genres: results.genres,
            book,
            errors: errors.array(),
          });
        }
      );
      return;
    }
    // data from form is valid, update the database
    Book.findByIdAndUpdate(req.params.id, book, {}, 
      (err, thebook) => {
        if (err) {
          return next(err);
        }
        res.redirect(thebook.url);
      });
  }
]