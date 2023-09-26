var express = require('express');
var router = express.Router();
const Book = require('../models').Book;

/* GET home page. */
router.get('/', async (req, res, next) => {
  try {
    const books = await Book.findAll(); 
    res.json(books); 
  } catch (err) {
    next(err);
  }
});

module.exports = router;
