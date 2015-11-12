var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var flash = require('connect-flash');

var passport = require('passport');
var GithubStrategy = require('passport-github').Strategy;

var app = express();

var config;

if (app.get('env') === 'development') {
    config = require('./config/development.json');
} else {
    config = require('./config/production.json');
}

app.set("config", config);

global.config = config;

var routes = require('./routes/index');
var api = require('./routes/api');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 启用 session
app.use(session({
    secret: 'myStars',
    store: new RedisStore(config.redis),
    resave: false,
    saveUninitialized: false
}));

app.use(flash());

// 初始化 passport
app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);
app.use('/api', api);

// Configure github strategy
passport.use(new GithubStrategy({
    clientID: config.auth.client_id,
    clientSecret: config.auth.client_secret,
    callbackURL: config.auth.redirect_uri
}, function(accessToken, refreshToken, profile, done){
    done(null, {
        accessToken: accessToken,
        profile: profile
    });
}));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
