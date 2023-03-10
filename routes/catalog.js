const express = require('express');
const router = express.Router();

// require controller modules
const book_controller = require('../controllers/bookController');
const author_controller = require('../controllers/authorController');
const genre_controller = require('../controllers/genreController');
const book_instance_controller = require('../controllers/bookInstanceController');

// book routes
// GET catalog home page
router.get("/", book_controller.index);
// GET req for creating a book
router.get('/book/create', book_controller.book_create_get);
// POST req for creating book
router.post("/book/create", book_controller.book_create_post);
// GET req for deleting book
router.get("/book/:id/delete", book_controller.book_delete_get);
// POST req for deleting book
router.post("/book/:id/delete", book_controller.book_delete_post);
// GET req to update book
router.get('/book/:id/update', book_controller.book_update_get);
// POST req to update book
router.post('/book/:id/update', book_controller.book_update_post);
// GET req for one book
router.get('/book/:id', book_controller.book_detail);
// GET req for list of all book items
router.get('/books', book_controller.book_list);

// author routes
// GET req for creating author
router.get("/author/create", author_controller.author_create_get);
// POST req for creating author
router.post("/author/create", author_controller.author_create_post);
// GET req to delete author
router.get("/author/:id/delete", author_controller.author_delete_get);
// POST req to delete author
router.post("/author/:id/delete", author_controller.author_delete_post);
// GET req to update author
router.get("/author/:id/update", author_controller.author_update_get);
// POST req to update author
router.post("/author/:id/update", author_controller.author_update_post);
// GET req for one author
router.get("/author/:id", author_controller.author_detail);
// GET req for all authors
router.get("/authors", author_controller.author_list);

// genre routes
// GET req for creating genre
router.get("/genre/create", genre_controller.genre_create_get);
// POST req for creating genre
router.post("/genre/create", genre_controller.genre_create_post);
// GET req for deleting genre
router.get("/genre/:id/delete", genre_controller.genre_delete_get);
// POST req for deleting genre
router.post("/genre/:id/delete", genre_controller.genre_delete_post);
// GET req for updating genre
router.get("/genre/:id/update", genre_controller.genre_update_get);
// POST req for updating genre
router.post("/genre/:id/update", genre_controller.genre_update_post);
// GET req for one genre
router.get("/genre/:id", genre_controller.genre_detail);
// GET req for genre list
router.get("/genres", genre_controller.genre_list);

// book instance routes
// GET req for creating bookinstance
router.get("/bookinstance/create", book_instance_controller.bookinstance_create_get);
// POST req for creating bookinstance
router.post("/bookinstance/create", book_instance_controller.bookinstance_create_post);
// GET req for deleting bookinstance
router.get("/bookinstance/:id/delete", book_instance_controller.bookinstance_delete_get);
// POST req for deleting bookinstance
router.post("/bookinstance/:id/delete", book_instance_controller.bookinstance_delete_post);
// GET req for updating bookinstance
router.get("/bookinstance/:id/update", book_instance_controller.bookinstance_update_get);
// POST req for updating bookinstance
router.post("/bookinstance/:id/update", book_instance_controller.bookinstance_update_post);
// GET req for single bookinstance
router.get('/bookinstance/:id', book_instance_controller.bookinstance_detail);
// GET req for all bookinstances
router.get('/bookinstances', book_instance_controller.bookinstance_list);

module.exports = router;