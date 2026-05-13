require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var kategoriRouter= require('./routes/kategori');
const produkRouter = require('./routes/produk');
const registerRouter = require('./routes/auth/register');
const loginRouter = require('./routes/auth/login');
const cors = require('cors');
const { onlyDomain } = require('./config/middleware/corsOptions');

var app = express();
app.use(cors(onlyDomain));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware removed as the project uses JWT Authentication [cite: cleanup]

app.use('/api/kategori', kategoriRouter);
app.use('/api/produk', produkRouter);
app.use('/api/register', registerRouter);
app.use('/api/login', loginRouter);
app.use('/static', express.static(path.join(__dirname, 'public/images')));
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
