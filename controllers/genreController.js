const Genre = require("../models/genre");
const Book = require("../models/book");
const async = require("async");
const { body, validationResult } = require("express-validator");

// display list of all genre
exports.genre_list = (req, res, next) => {
  Genre.find()
    .sort({name: "ascending"})
    .exec((err, list_genre) => {
      if (err) {
        return next(err);
      }
      res.render("genre_list", { title: "Genre List", genre_list: list_genre })
    })
}

// display detail page for a specific genre
exports.genre_detail = (req, res, next) => {
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genre_books(callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        const err = new Error("Genre not found");
        err.status = 404;
        return next(err);
      }
      res.render("genre_detail", { title: "Genre Detail", genre: results.genre, genre_books: results.genre_books });
    }
  )
}

// display genre create form on GET
exports.genre_create_get = (req, res) => {
  res.render("genre_form", { title: "Create Genre" });
}

// handle genre create on POST
exports.genre_create_post = [
  // validate that the name field is not empty & sanitize
  body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),
  // process request after being validated and sanitized
  (req, res, next) => {
    // extract the validation errors from the req (if any)
    const errors = validationResult(req);
    // create a genre object with the escaped and trimmed data
    const genre = new Genre({ name: req.body.name });
    if (!errors.isEmpty()) {
      // ie there are errors; back to form, w/ sanitized values and error messages
      res.render("genre_form", { title: "Create Genre", genre, errors: errors.array(),
      });
      return;
    } else {
      // check if genre already exists in db
      Genre.findOne({ name: req.body.name }).exec((err, found_genre) => {
        if (err) {
          return next(err);
        }
        if (found_genre) {
          // genre exists, redirect to its detail page
          res.redirect(found_genre.url);
        } else {
          genre.save((err) => {
            if (err) {
              return next(err);
            }
            // new genre saved to db, redirect to detail page
            res.redirect(genre.url);
          })
        }
      })
    }
  }
]
// display genre delete form on GET
exports.genre_delete_get = (req, res, next) => {
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      books(callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        res.redirect("/catalog/genres");
      }
      res.render("genre_delete", {
        title: "Delete Genre",
        books: results.books,
        genre: results.genre,
      });
    }
  );
};

// handle genre delete on POST
exports.genre_delete_post = (req, res, next) => {
  console.log(req.body);
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.body.id).exec(callback);
      },
      books(callback) {
        Book.find({ genre: req.body.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.books.length > 0) {
        // there are still books w/ that genre, they need to be deleted first
        res.render("genre_delete", {
          title: "Delete Genre",
          books: results.books,
          genre: results.genre,
        });
        return;
      }
      // genre has no books: delete object and redirect to genre list
      Genre.findByIdAndRemove(req.body.id, (err) => {
        console.log(req.body);
        if (err) {
          return next(err);
        }
        res.redirect("/catalog/genres");
      });
    }
  );
};

// display genre update form on GET
exports.genre_update_get = (req, res, next) => {
  Genre.findById(req.params.id).exec((err, results) => {
    if (err) {
      return next(err);
    }
    if (results == null) {
      const err = new Error("Genre not found");
      err.status = 404;
      return next(err);
    }
    res.render("genre_form", {
      title: "Update Genre",
      genre: results,
    })
  })
}

// handle genre update on POST
exports.genre_update_post = [
  body("name", "Genre must be specified")
    .trim()
    .isLength({ min: 3 })
    .escape(),
  (req, res, next) => {
    const errors = validationResult(req);

    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });
    if (!errors.isEmpty()) {
      res.render("genre_form", {
        title: "Update Genre",
        genre,
        errors: errors.array(),
      });
      return;
    }
    Genre.findByIdAndUpdate(req.params.id, genre, {},
      (err, results) => {
        if (err) {
          return next(err);
        }
        res.redirect(results.url);
      }
    );
  }
]