var express = require('express');
var passport = require('passport');
var Publisher = require('../models/patients');
var multer  = require('multer');
var moment = require('moment');
var _ = require('underscore');
var url = require('url');
var dotenv = require('dotenv');
var async = require("async");
var router = express.Router();

var upload = multer();

dotenv.load();


function getIntervalFor(key, loc){
	var intervals = {
		albumin: {us:{unit: 'g/dL', interval:[2.6,3.9]}, international:{unit: '', interval:[]}},
		totalProtein: {us:{unit: 'g/dL', interval:[6.3,8.8]}, international:{unit: '', interval:[]}},
		globulin: {us:{unit: 'g/dL', interval:[3.0,5.9]}, international:{unit: '', interval:[]}},
		bun: {us:{unit: 'mg/dL', interval:[16,37]}, international:{unit: '', interval:[]}},
		creatinine: {us:{unit: 'mg/dL', interval:[0.9,2.5]}, international:{unit: '', interval:[]}},
		cholesterol: {us:{unit: 'mg/dL', interval:[91,305]}, international:{unit: '', interval:[]}},
		glucose: {us:{unit: 'mg/dL', interval:[72,175]}, international:{unit: '', interval:[]}},
		calcium: {us:{unit: 'mg/dL', interval:[8.2,11.2]}, international:{unit: '', interval:[]}},
		phosphorus: {us:{unit: 'mg/dL', interval:[2.9,6.3]}, international:{unit: '', interval:[]}},
		tco2: {us:{unit: 'mmol/L', interval:[12,22]}, international:{unit: '', interval:[]}},
		chloride: {us:{unit: 'mmol/L', interval:[114,126]}, international:{unit: '', interval:[]}},
		potassium: {us:{unit: 'mmol/L', interval:[3.7,5.2]}, international:{unit: '', interval:[]}},
		sodium: {us:{unit: 'mmol/L', interval:[147,157]}, international:{unit: '', interval:[]}},
		alb_glob_ratio: {us:{unit: 'ratio', interval:[0.5,1.2]}, international:{unit: '', interval:[]}},
		bun_creatinine_ratio: {us:{unit: 'ratio', interval:[]}, international:{unit: '', interval:[]}},
		na_k_ratio: {us:{unit: 'ratio', interval:[29,42]}, international:{unit: '', interval:[]}},
		anion_gap: {us:{unit: 'mmol/L', interval:[12,25]}, international:{unit: '', interval:[]}},
		sdma: {us:{unit: 'ug/dL', interval:[0,14]}, international:{unit: '', interval:[]}},
		wbc: {us:{unit: 'K/uL', interval:[3.9,19]}, international:{unit: '', interval:[]}},
		rbc: {us:{unit: 'M/uL', interval:[7.12,11.46]}, international:{unit: '', interval:[]}},
		hgb: {us:{unit: 'g/dL', interval:[10.3,16.2]}, international:{unit: '', interval:[]}},
		hct: {us:{unit: 'percent', interval:[28.2,52.7]}, international:{unit: '', interval:[]}},
		mcv: {us:{unit: 'fL', interval:[39,56]}, international:{unit: '', interval:[]}},
		mch: {us:{unit: 'pg', interval:[12.6,16.5]}, international:{unit: '', interval:[]}},
		mchc: {us:{unit: 'g/dL', interval:[28.5,37.8]}, international:{unit: '', interval:[]}},
		per_reticulocyte: {us:{unit: 'percent', interval:[]}, international:{unit: '', interval:[]}},
		reticulocyte: {us:{unit: 'K/uL', interval:[3,50]}, international:{unit: '', interval:[]}},
		per_neutrophil: {us:{unit: 'percent', interval:[]}, international:{unit: '', interval:[]}},
		neutrophil: {us:{unit: '/uL', interval:[2620,15170]}, international:{unit: '', interval:[]}},
		per_lymphocyte: {us:{unit: 'percent', interval:[]}, international:{unit: '', interval:[]}},
		lymphocyte: {us:{unit: '/uL', interval:[850,5850]}, international:{unit: '', interval:[]}},
		per_monocyte: {us:{unit: 'percent', interval:[]}, international:{unit: '', interval:[]}},
		monocyte: {us:{unit: '/uL', interval:[40,530]}, international:{unit: '', interval:[]}},
		per_eosinophil: {us:{unit: 'percent', interval:[]}, international:{unit: '', interval:[]}},
		eosinophil: {us:{unit: '/uL', interval:[90,2180]}, international:{unit: '', interval:[]}},
		per_basophil: {us:{unit: 'percent', interval:[]}, international:{unit: '', interval:[]}},
		basophil: {us:{unit: '/uL', interval:[0,100]}, international:{unit: '', interval:[]}},
		platelet: {us:{unit: 'K/uL', interval:[155,641]}, international:{unit: '', interval:[]}}
	}
	return intervals[key][loc]
}

//for all /api/*
function ensureAuthenticated(req, res, next) {
	if (!req.isAuthenticated()) { 
		console.log('not auth')
		return res.redirect('/login');
		
	}
	Publisher.find({username: req.user.username}, function(err, data){
		if (err) {
			return next(err)
		}
		//console.log('auth')
		//console.log(data)
		if (!data || data.length === 0) {
			return res.redirect('/login');
		} else {
			return next();
		}
	})
}

function ensureContent(req, res, next) {
	var outputPath = url.parse(req.url).pathname;
	console.log('ensurecontent path')

	if (req.session.measure) {
		var username = req.session.measure
		//req.params.namekey ? req.params.namekey : req.user.username;
		console.log(outputPath, username)
		require('../models/measures.js')({collection: username}).find({}, function(err, data){
			if (err) {
				return next(err)
			}
			//console.log('ensurecontent data')
			//console.log(data)
			

			if (!data || data.length === 0) {
				if (req.isAuthenticated()) {
					return res.redirect('/init/'+username)
				} else {
					return res.redirect('/register')
				}
				
			}
			req.measurements = require('../models/measures.js')({collection: username});
			req.session.measure = username;
			return next();
		})
	} else {
		if (req.isAuthenticated()) {
			//console.log(outputPath, req.user.username)
			req.measurements = require('../models/measures.js')({collection: req.user.username});
			req.session.measure = req.user.username;
			return res.redirect('/api/'+req.user.username+'')
		} else {
			return res.redirect('/register')
		}
	}
}

function ensurePublisher(req, res, next) {
	var username = req.params.namekey;
	Publisher.find({username: username}, function(err, data){
		if (err) {
			return next(err)
		}
		//console.log(data)
		if (!data || data.length === 0) {
			return next('route')
		} else {
			return next();
		}
	})
}

router.param('namekey', ensurePublisher);

//router.all(/^(?!\/$)(?!\/register$)(?!\/login$)(?!\/logout$).+/, ensureContent);

router.get('/', function(req, res, next) {
	if (req.isAuthenticated()) {
		return res.redirect('/api/'+req.user.username+'')
	} else {
		//return res.redirect('/login');
		return res.redirect('/register');
	}

})

router.get('/login', function(req, res, next){
	var outputPath = url.parse(req.url).pathname;
	// console.log(outputPath)
	return res.render('login', { 
		user: req.user
	});
});

router.post('/login', passport.authenticate('local'/*, { session: false }*/), 
	function(req, res, next) {
	// If this function gets called, authentication was successful.
	// `req.user` contains the authenticated user.
	req.session.user = req.user;
	req.measurements = require('../models/measures.js')({collection: req.user.username})
	return res.redirect('/api/'+req.user.username);
});

router.get('/logout', function(req, res) {
	var outputPath = url.parse(req.url).pathname;
	req.logout();
	if (req.user || req.session) {
		req.user = null;
		req.session.destroy(function(err){
			if (err) {
				req.session = null;
				//improve error handling
				return res.redirect('/');
			} else {
				req.session = null;
				return res.redirect('/');
			}
		});		
	} else {
		return res.redirect('/');
	}
});

router.get('/register', function(req, res) {
	return res.render('register', { } );
});


router.post('/register', function(req, res, next) {
	Publisher.register(new Publisher({ givenName: req.body.name, username: req.body.username }), req.body.password, function(err, user) {
		if (err) {
			console.log(err)
			return res.render('register', {info: "Sorry. That username already exists. Try again."});
		}

		passport.authenticate('local'/*, { session: false }*/)(req, res, function () {
			Publisher.findOne({username: req.body.username}, function(error, doc){
				if (error) {
					console.log(outputPath, error)
					return next(error)
				}
				req.user = doc;
				req.session.username = req.body.username;
				return res.redirect('/init/'+doc.username)
			})
		});
	});
});

router.get('/init/:namekey', ensureAuthenticated/*, ensurePublisher, ensureContent*/, function(req, res, next) {
	var outputPath = url.parse(req.url).pathname;
	console.log(outputPath)
	async.waterfall([
		function(next){
			var username = req.user.username;
			req.measurements = require('../models/measures.js')({collection: username});
			req.measurements.find({}, function(err, data){
				if (err) {
					return next(err)
				}
				var measurements = {
					albumin: 2.1,
					totalProtein: 8.1,
					globulin: 6.0,
					bun: 72,
					creatinine: 2.2,
					cholesterol: 137,
					glucose: 96,
					calcium: 9.1,
					phosphorus: 5.1,
					tco2: 17,
					chloride: 122,
					potassium: 4.5,
					sodium: 153,
					alb_glob_ratio: 0.4,
					bun_creatinine_ratio: 32.7,
					na_k_ratio: 34,
					anion_gap: 19,
					sdma: 32,
					wbc: 11.3,
					rbc: 5.44,
					hgb: 7.9,
					hct: 26.0,
					mcv: 48,
					mch: 14.5,
					mchc: 30.4,
					per_reticulocyte: 0.1,
					reticulocyte: 5,
					per_neutrophil: 86,
					neutrophil: 9718,
					per_lymphocyte: 3,
					lymphocyte: 339,
					per_monocyte: 4,
					monocyte: 452,
					per_eosinophil: 7,
					eosinophil: 791,
					per_basophil: 0,
					basophil: 0,
					platelet: 439
				}
				/*var measurements = {
					albumin: 0,
					totalProtein: 0,
					globulin: 0,
					bun: 0,
					creatinine: 0,
					cholesterol: 0,
					glucose: 0,
					calcium: 0,
					phosphorus: 0,
					tco2: 0,
					chloride: 0,
					potassium: 0,
					sodium: 0,
					alb_glob_ratio: 0,
					bun_creatinine_ratio: 0,
					na_k_ratio: 0,
					anion_gap: 0,
					sdma: 0,
					wbc: 0,
					rbc: 0,
					hgb: 0,
					hct: 0,
					mcv: 0,
					mch: 0,
					mchc: 0,
					per_reticulocyte: 0,
					reticulocyte: 0,
					per_neutrophil: 0,
					neutrophil: 0,
					per_lymphocyte: 0,
					lymphocyte: 0,
					per_monocyte: 0,
					monocyte: 0,
					per_eosinophil: 0,
					eosinophil: 0,
					per_basophil: 0,
					basophil: 0,
					platelet: 0
				}*/
				var keys = Object.keys(measurements);
				
				var measurementdata = [];
				var lookup = ['bun', 'sdma', 'na_k_ratio'];

				//req.measurements = require('../models/measures.js')({collection: username});
				keys.forEach(function(key){
					var mea = new req.measurements({
						patient: req.user.username,
						key: key,
						data: [ 
							{
								name: key,
								index: 0,
								val: measurements[key],
								date: moment().utc().format()
							} 
						],
						high: getIntervalFor(key, 'us').interval[1],
						low: getIntervalFor(key, 'us').interval[0],
						unit: getIntervalFor(key, 'us').unit,
						vis: lookup.indexOf(key) !== -1 ? true : false
						
					});
					mea.save(function(err) {
						if (err) {
							return next(err)
						}
					})
				})
				next(null)
			})
		}
	], function(err){
		if (err) {
			return next(err)
		}
		return res.redirect('/')
	})
	
})


router.get('/view/:namekey', ensureContent, function(req, res, next){
	var outputPath = url.parse(req.url).pathname;
	var username = req.params.namekey;
	require('../models/measures.js')({collection: username}).find().lean().exec(function(err, data){
		if (err) {
			return next(err)
		}
		if (data.length === 0) {
			return res.redirect('/init/'+username)
		} else {
			require('../models/measures.js')({collection: username}).find({vis:true}).lean().exec(function(err, result){
				if (err) {
					return next(err)
				}
				var dots = [];
				var keys = [];
				//result = result.toObject();
				
				for (var j in result) {
					for (var i in result[j].data) {
						var datObj = result[j].data[i];
						if (isNaN(Object.keys(datObj))) {
							console.log(result[j].data[i]);
							dots.push(datObj)
						}
					}
					keys.push(result[j].key)
				}	
				//console.log(result[0].data)
				return res.render('index', {
					index: result[0].data[result[0].data.length - 1].index,
					data: data,
					result: result,
					dots: dots,
					keys: keys
				});
				
			})		
		}
		
	})
})

router.all('/api/*', require('connect-ensure-login').ensureLoggedIn());

router.get('/api/:namekey', ensureContent, function(req, res, next){
	var outputPath = url.parse(req.url).pathname;
	console.log(outputPath)
	var username = req.params.namekey;

	require('../models/measures.js')({collection: username}).find({}, function(err, data){
		if (err) {
			return next(err)
		}
		if (data.length === 0) {
			return res.redirect('/init/'+username)
		} else {
			require('../models/measures.js')({collection: username}).find({vis:true}).lean().exec(function(err, result){
				if (err) {
					return next(err)
				}
				var dots = [];
				//console.log(result)
				var keys = [];
				//result = result.toObject();
				for (var j in result) {
					for (var i in result[j].data) {
						var datObj = result[j].data[i];
						if (Object.keys(datObj).length) {
							dots.push(datObj)
						}
					}
					keys.push(result[j].key)
				}	
				//console.log(result[0].data)
				return res.render('index', {
					index: result[0].data[result[0].data.length - 1].index,
					data: data,
					result: result,
					dots: dots,
					keys: keys
				});
				
			})		
		}
		
	})
})

router.get('/api/checkdate/:namekey/:date', ensureContent, function(req, res, next){
	var outputPath = url.parse(req.url).pathname;
	require('../models/measures.js')({collection: username}).find({'data.date': body.date}).lean().exec(function(err, measures) {
		if (err) {
			return next(err)
		}
		if (!err && measures.length === 0) {
			return res.send(null)
		}
		//console.log(measures) 
		return res.send('ok');
	})
})

router.post('/api/reveal/:namekey/:key', ensureContent, function(req, res, next){
	//Publisher.findOne({key: req.params.namekey}, {measurements: {$elemMatch:{key: {$in: req.params.keys}}}}, function(err, doc){
	var outputPath = url.parse(req.url).pathname;
	console.log(outputPath) 
	var set = {$set:{}};
	var key = 'vis'
	set.$set[key] = true;
	require('../models/measures.js')({collection: req.params.namekey}).findOneAndUpdate({key: req.params.key}, set, {new: true, safe: true, multi: false}, function(err, result) {
		if (err) {
			return next(err)
		}
		return res.send('ok')
	}) 
})

router.post('/api/hide/:namekey/:key', ensureContent, function(req, res, next){
	//Publisher.findOne({key: req.params.namekey}, {measurements: {$elemMatch:{key: {$in: req.params.keys}}}}, function(err, doc){
	var outputPath = url.parse(req.url).pathname;
	console.log(outputPath); 
	var set = {$set:{}};
	var key = 'vis'
	set.$set[key] = false;
	require('../models/measures.js')({collection: req.params.namekey}).findOneAndUpdate({key: req.params.key}, set, {new: true, safe: true, multi: false}, function(err, result) {
		if (err) {
			return next(err)
		}
		require('../models/measures.js')({collection: req.params.namekey}).find({vis:true}).lean().exec(function(err, results) {
			if (err) {
				return next(err)
			}
			if (results.length === 0) {
				require('../models/measures.js')({collection: req.params.namekey}).findOneAndUpdate({key: 'sdma'}, {$set: {vis: true}}, {new: true, safe: true, multi: false}, function(err, result) {
					if (err) {
						return next(err)
					}
				})
				return res.send('ok')
			}
			return res.send('ok')
		})
	}) 
})

/*router.get('/api/edit/:namekey/:index', ensureContent, function(req, res, next){
	var username = req.params.namekey;

	req.measurements = require('../models/measures.js')({collection: username});
	req.measurements.find({patient: req.params.namekey}, function(err, data){
		if (err) {
			return next(err)
		}
		var keys = [];
		for (var i in data) {
			var dat = {
				name: key,
				index: 0,
				val: measurements[key],
				date: moment().utc().format()
			} 
			data[i].data.push(dat);
			data[i].save(function(err){
				if (err) {
					console.log(err)
				}
			})
		}
		if (!err && data.length === 0) {
			var measurements = {
				albumin: 0,
				totalProtein: 0,
				globulin: 0,
				bun: 0,
				creatinine: 0,
				cholesterol: 0,
				glucose: 0,
				calcium: 0,
				phosphorus: 0,
				tco2: 0,
				chloride: 0,
				potassium: 0,
				sodium: 0,
				alb_glob_ratio: 0,
				bun_creatinine_ratio: 0,
				na_k_ratio: 0,
				anion_gap: 0,
				sdma: 0,
				wbc: 0,
				rbc: 0,
				hgb: 0,
				hct: 0,
				mcv: 0,
				mch: 0,
				mchc: 0,
				per_reticulocyte: 0,
				reticulocyte: 0,
				per_neutrophil: 0,
				neutrophil: 0,
				per_lymphocyte: 0,
				lymphocyte: 0,
				per_monocyte: 0,
				monocyte: 0,
				per_eosinophil: 0,
				eosinophil: 0,
				per_basophil: 0,
				basophil: 0,
				platelet: 0
			}
			var keys = Object.keys(measurements);
			
			var measurementdata = [];
			var lookup = ['sdma'];
			req.measurements = require('../models/measures.js')({collection: username});

			keys.forEach(function(key){
				var mea = new req.measurements({
					patient: req.params.namekey,
					key: key,
					data: [ 
						{
							name: key,
							index: 0,
							val: measurements[key],
							date: moment().utc().format()
						} 
					],
					high: getIntervalFor(key, 'us').interval[1],
					low: getIntervalFor(key, 'us').interval[0],
					unit: getIntervalFor(key, 'us').unit,
					vis: lookup.indexOf(key) !== -1 ? true : false
					
				});
				mea.save(function(err) {
					if (err) {
						return next(err)
					}
				})
			})
			return res.redirect('/')
		} else {
			
		var keys = [];
		for (var i in data) {
			var dat = {
				name: key,
				index: 0,
				val: measurements[key],
				date: moment().utc().format()
			} 
			data[i].data.push(dat);
			data[i].save(function(err){
				if (err) {
					console.log(err)
				}
			})
				
			}
			return res.redirect('/')
		}
	})
})*/

router.get('/api/add/:namekey/:index', ensureContent, function(req, res, next){
	var username = req.params.namekey;

	req.measurements = require('../models/measures.js')({collection: username});
	req.measurements.find({patient: req.params.namekey}, function(err, data){
		if (err) {
			return next(err)
		}
		
		if (!err && data[0].data[data[0].data.length - 1].index === parseInt(req.params.index, 10) - 1) {
			var measurements = {
				albumin: 0,
				totalProtein: 0,
				globulin: 0,
				bun: 0,
				creatinine: 0,
				cholesterol: 0,
				glucose: 0,
				calcium: 0,
				phosphorus: 0,
				tco2: 0,
				chloride: 0,
				potassium: 0,
				sodium: 0,
				alb_glob_ratio: 0,
				bun_creatinine_ratio: 0,
				na_k_ratio: 0,
				anion_gap: 0,
				sdma: 0,
				wbc: 0,
				rbc: 0,
				hgb: 0,
				hct: 0,
				mcv: 0,
				mch: 0,
				mchc: 0,
				per_reticulocyte: 0,
				reticulocyte: 0,
				per_neutrophil: 0,
				neutrophil: 0,
				per_lymphocyte: 0,
				lymphocyte: 0,
				per_monocyte: 0,
				monocyte: 0,
				per_eosinophil: 0,
				eosinophil: 0,
				per_basophil: 0,
				basophil: 0,
				platelet: 0
			}
			var keys = Object.keys(measurements);
			
			var measurementdata = [];
			var lookup = ['sdma'];
			req.measurements = require('../models/measures.js')({collection: username});

			keys.forEach(function(key){
				var mea = new req.measurements({
					patient: req.params.namekey,
					key: key,
					data: [ 
						{
							name: key,
							index: 0,
							val: measurements[key],
							date: moment().utc().format()
						} 
					],
					high: getIntervalFor(key, 'us').interval[1],
					low: getIntervalFor(key, 'us').interval[0],
					unit: getIntervalFor(key, 'us').unit,
					vis: lookup.indexOf(key) !== -1 ? true : false
					
				});
				mea.save(function(err) {
					if (err) {
						return next(err)
					}
				})
			})
			return res.redirect('/')
		} else {
			var keys = [];
			for (var i in data) {
				var dat = {
					name: key,
					index: parseInt(req.params.index, 10),
					val: measurements[key],
					date: moment().utc().format()
				} 
				data[i].data.push(dat);
				data[i].save(function(err){
					if (err) {
						console.log(err)
					}
				})
				/*req.measurements.findOneAndUpdate({key: data[i].key}, {$push:{data:dat}}, {safe: true, multi: false}, function(err, doc){
					if (err) {
						console.log(err)
					}
				})*/
				
			}
			return res.redirect('/')
		}
	})
})

router.post('/api/add/:namekey/:index', upload.array(), ensureContent, function(req, res, next){
	var body = req.body;
	//console.log(req)
	var keys = Object.keys(body);
	console.log(keys)
	//var keys = Object.keys(measurements);
	var username = req.params.namekey;

	req.measurements = require('../models/measures.js')({collection: username});

	req.measurements.find({}, function(err, data){
		if (err) {
			return next(err)
		}
		
		if (!err && data.length === 0) {
			return res.redirect('/')
			
		} else {
			req.measurements.find({data: {date: body.date}}).lean().exec(function(err, measures) {
				if (err) {
					return next(err)
				}
				var date = body.date
				keys.splice(keys.indexOf('date'), 1);
				if (!err && measures.length === 0) {
					// new
					async.waterfall([
						function(cb){
							var counter = data[0].data.length;
							var username = req.params.namekey;

							req.measurements = require('../models/measures.js')({collection: username});

							keys.forEach(function(key, i){
								var mea = new req.measurements({
									patient: req.params.namekey,
									key: key,
									data: [ 
										{
											name: key,
											index: counter,
											val: body[key],
											date: date
										} 
									],
									high: getIntervalFor(key, 'us').interval[1],
									low: getIntervalFor(key, 'us').interval[0],
									unit: getIntervalFor(key, 'us').unit,
									vis: true
									
								});
								mea.save(function(err) {
									if (err) {
										console.log(err)
									}
									counter++
								})
							})
							cb(null)
						}
					], function(err){
						if (err) {
							console.log(err)
						}
						return res.redirect('/')
						
						
					})
				} else {
					Object.keys(body).forEach(function(key, i){
						
						var query = {key: key, data:{$elemMatch:{date: body.date}}};
						var set = {$set:{}}
						var k = 'data.$.val'
						set.$set[k] = body[key]
						req.measurements.findOneAndUpdate(query, set, {new: true, safe: true, upsert: false}, function(err, doc){
							if (err) {
								return next(err)
							}
							
						})
					})
					return res.redirect('/')
				}
			})
		}
	})
})

module.exports = router;