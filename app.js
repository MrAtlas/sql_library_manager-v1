const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const sequelize = require('./models').sequelize;
const { Book } = require('./models');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Home route should redirect to the /books route
app.get('/', (req, res) => {
  res.redirect('/books');
});

// full list of books
app.get('/books', async (req, res, next) => {
  try {
    const books = await Book.findAll();
    res.render('index', { books });
  } catch (err) {
    next(err);
  }
});

// create new book form
app.get('/books/new', (req, res) => {
  res.render('new-book');
});

// Posts a new book to the database
app.post('/books/new', async (req, res, next) => {
  try {
    const { title, author, genre, year } = req.body;
    await Book.create({ title, author, genre, year });
    res.redirect('/books');
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(error => error.message);
      res.render('new-book', { errors: error.errors, title: "Update Book" });
    } else {
      next(error);
    }
  }
});

// Shows book form
app.get('/books/:id', async (req, res, next) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (book) {
      res.render('update-book', { book });
    } else {
      next(createError(404, 'Book not found'));
    }
  } catch (err) {
    next(err);
  }
});

// Updates book info
app.get('/books/:id', async (req, res) => {
  const book = await Book.findByPk(req.params.id);
  res.render('update-book', { book, title: 'Update Book' })
});

app.post('/books/:id', async (req, res) => {
  let book;
  try {
    book = await Book.findByPk(req.params.id);
    await book.update(req.body);
    res.redirect('/books/');
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      book = await Book.findByPk(req.params.id);
      res.render('update-book', { book, errors: error.errors, title: "Update Book" });
    } else {
      throw error;
    }
  }
  
})

// Delete book
app.post('/books/:id/delete', async (req, res, next) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (book) {
      await book.destroy();
      res.redirect('/books');
    } else {
      next(createError(404, 'Book not found'));
    }
  } catch (err) {
    next(err);
  }
});


// 404 error handler
app.use(function (req, res, next) {
  res.status(404).render('page-not-found');
});

// Global error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection to the database has been established successfully.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

app.listen(3001, () => {
  console.log(`Server is running on port 3001`);
});

module.exports = app;
