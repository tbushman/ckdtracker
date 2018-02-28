const alphabet = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
var express = require('express');
var path = require('path');
var dotenv = require('dotenv');
var favicon = require('serve-favicon');
var fs = require('fs');
dotenv.load();

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.locals.$ = require('jquery');

app.use(favicon(path.join(__dirname, 'public', 'img', 'favicon.ico')));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res, next){
	var index;
	if (!req.app.locals.index || req.app.locals.index === undefined) {
		index = 0;
	} else {
		index = req.app.locals.index;
	}
	req.app.locals.index = index;
	res.redirect('/init');
})

app.get('/index/:index', function(req, res, next){
	var index = req.params.index;
	if (!isNaN(parseInt(index, 10))) {
		req.app.locals.index = parseInt(index, 10);
		return res.redirect('/init')		
	} else {
		return res.redirect('/');		
	}
})

app.get('/init', function(req, res, next){
	// index is template
	var index = req.app.locals.index;
	if (index === undefined) {
		return res.redirect('/');
	}
	fs.readFile(path.join(__dirname, 'public/json/trans-property.js'), 'utf8', function(err, data){
		if (err) {
			return next(err)
		}
		data = JSON.parse(data);
		var transProperty = Object.keys(data[index])[0];
		var transValues = data[index][transProperty];
		var transProperties = Object.keys(data[index]);
		
		transProperties = transProperties.filter(function(key){
			return Array.isArray(data[index][key]);
		})
		var css = `
		@charset 'UTF-8';
		:root { 
			--transProperty: ${transProperties.join(',')};
		}
		.container {
			height: ${data[index].container.height};
			top: ${data[index].container.top};
		}
		.lung {
			transition-property: var(--transProperty);
			transition-duration: ${req.app.locals.breath ? req.app.locals.breath : 4}s;
			position: relative;
		}
		.lung[title='in'] {
			transition-delay: ${req.app.locals.hold ? req.app.locals.hold : 2}s;
		}
		`;
		// each transition property is a className
		for (var i in transProperties) {
			if (i < 26) {
				css += `.lung[title='in'].${alphabet[i]} {
					${transProperties[i]}: ${data[index][transProperties[i]][1]};
				} 
				.lung[title='out'].${alphabet[i]} {
					${transProperties[i]}: ${data[index][transProperties[i]][0]};
				}`
			}
		}
		var arr = []
		for (var i = 0; i < data[index].amount; i++) {
			arr.push(i);
		}
		return res.render('layout', {
			css: css.toString(),
			data: data,
			mode: 'in',
			tpLength: transProperties.length,
			amount: arr,
			index: index,
			breath: req.app.locals.breath ? req.app.locals.breath : 4,
			hold: req.app.locals.hold ? req.app.locals.hold : 2
		})
	})
});

app.post('/change/:index/:breath/:hold', function(req, res, next){
	var index = req.params.index;
	var breath = req.params.breath.split('')[0];
	var hold = req.params.hold.split('')[0];
	req.app.locals.index = index;
	req.app.locals.breath = breath;
	req.app.locals.hold = hold;
	
	return res.redirect('/init');
})

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

module.exports = app;