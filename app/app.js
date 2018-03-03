var express = require('express');
var path = require('path');
var dotenv = require('dotenv');
var favicon = require('serve-favicon');
var fs = require('fs');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mongoose = require('mongoose');
var MongoDBStore = require('connect-mongo')(session);
var Publisher = require('./models/patients');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var promise = require('bluebird');
var multer = require('multer');
var routes = require('./routes/index');
var upload = multer();

mongoose.Promise = promise;
dotenv.load();

var parseForm = bodyParser.urlencoded({ extended: false });
var parseJSONBody = bodyParser.json();
var parseBody = [parseJSONBody, parseForm];

var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.locals.$ = require('jquery');
app.locals.appTitle = "CKDTracker";
app.use(favicon(path.join(__dirname, 'public', 'img', 'favicon.ico')));

app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req, res, next) {
		res.set({
			'Access-Control-Allow-Origin' : req.headers.origin,
			'Access-Control-Allow-Methods' : 'GET, POST, HEAD, OPTIONS',
			'Access-Control-Allow-Headers' : 'Cache-Control, Origin, Content-Type, Accept',
			'Access-Control-Allow-Credentials' : true
		});

		//app.use(helmet.noCache({}));

		next();
});

passport.use(new LocalStrategy(
  /*function(username, password, cb) {
    Publisher.findOne({username: username}, function(err, user) {
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }
      if (user.password != password) { return cb(null, false); }
      return cb(null, user);
    });
	})*/
	
	Publisher.authenticate())
);
// serialize and deserialize
passport.serializeUser(function(user, done) {
  //console.log('serializeUser: ' + user._id);
  done(null, user._id);
});
passport.deserializeUser(function(id, done) {
  Publisher.findOne({_id: id}, function(err, user){
    if(err) {
			return done(err);
			
		}
		done(null, user);
		
  });
});
//passport.use(Publisher.createStrategy());

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
	//proxy: true,
  cookie: { maxAge: 180 * 60 * 1000 }
}
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser(sess.secret));

app.use(session(sess));

app.use(passport.initialize());
app.use(passport.session());

if (app.get('env') === 'production') {
	app.set('trust proxy', 1) // trust first proxy
}

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

app.post(/^(\/register$|\/login$)/, upload.array(), parseBody);

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