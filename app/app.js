var express = require('express');
var path = require('path');
var dotenv = require('dotenv');
var favicon = require('serve-favicon');
var fs = require('fs');
var routes = require('./routes/index');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mongoose = require('mongoose');
var MongoDBStore = require('connect-mongo')(session);
dotenv.load();
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.locals.$ = require('jquery');
app.locals.appTitle = "CKDTracker";
app.use(favicon(path.join(__dirname, 'public', 'img', 'favicon.ico')));

app.use(express.static(path.join(__dirname, 'public')));
var store = new MongoDBStore(
	{
		mongooseConnection: mongoose.connection,
		uri: 'mongodb://localhost/session_ckd',
		collection: 'mySessions'
	}
)
store.on('error', function(error, next){
	next(error)
});
var sess = {
	secret: process.env.SECRET,
	name: 'nodecookie',
	resave: false,
	saveUninitialized: false,
	store: store,
  cookie: { maxAge: 180 * 60 * 1000 }
}

app.use(cookieParser(sess.secret));
app.use(session(sess));
if (app.get('env') === 'production') {
	app.set('trust proxy', 1) // trust first proxy
}

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
})
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

app.use(function (err, req, res) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});

var uri = process.env.DEVDB;

var promise = mongoose.connect(uri, { useMongoClient: true }/*, {authMechanism: 'ScramSHA1'}*/);
promise.then(function(db){
	db.on('error', console.error.bind(console, 'connection error:'));
});

module.exports = app;