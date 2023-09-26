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
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(error => error.message);
      res.render('new-book', { errors });
    } else {
      next(err);
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
app.post('/books/:id', async (req, res, next) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return next(createError(404, 'Book not found'));
    }

    const { title, author, genre, year } = req.body;
    book.title = title;
    book.author = author;
    book.genre = genre;
    book.year = year;
    await book.save();

    res.render('update-book', { book });
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(error => error.message);
      res.render('update-book', { errors });
    } else {
      next(err);
    }
  }
});

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
app.use((req, res, next) => {
  const err = new Error('Page Not Found');
  err.status = 404;
  next(err);
});

// Global error handler
app.use((err, req, res, next) => {
  err.status = err.status || 500;
  console.error(`Error ${err.status}: ${err.message}`);

  res.status(err.status);

  if (err.status === 404) {
    res.render('page-not-found', { error: err });
  } else {
    res.render('error', { err });
  }
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
