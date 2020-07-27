var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');
var expressLayouts = require('express-ejs-layouts');
var flash = require('connect-flash');
var session = require('express-session');
var bodyParser = require('body-parser')
//var LocalStrategy = require('passport-local').Strategy;


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');


var app = express();


// Passport Config
require('./config/passport')(passport);

//Layouts


app.use(cookieParser('secret'));

app.use(expressLayouts);

app.use(express.static('uploads'));



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Express session

app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  })
);


// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

// Connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.success_messages = req.flash('success_messages');
  res.locals.error_messages = req.flash('error_messages');

  next();
});


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use( bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
/*
app.use(function(req, res, next) {
  next(createError(404));
});

*/

app.use(function(req, res, next){
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.render('page-not-found', { url: req.url });
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});

//style me
app.use(express.static(__dirname + '/public'));

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
