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

function ensureEmbeddedIndex(req, res, next) {
	var username = req.params.namekey;
	req.measurements = require('../models/measures.js')({collection: username});
	req.measurements.find({}).sort({'data.date': 1}).lean().exec(function(dat){
		for (var i in dat) {
			var data = dat.data.sort(function(a,b){
				if (moment(a.date).utc().format() > moment(b.date).utc().format()) {
					return -1;
				} else if (moment(a.date).utc().format() < moment(b.date).utc().format()) {
					return 1;
				}
			})
			var count = 0;
			data.forEach(function(ind, i){
				if (ind.index !== i) {
					ind.index = i;
					count++;
				}
			})
			if (count > 0) {
				req.measurements.findOneAndUpdate({_id: m._id}, {$set:{data:JSON.parse(JSON.stringify(data))}}, {$multi: false}, function(err, data){
					if (err) {
						return next(err)
					}
				})
			}
		}

		return next();
	})
		

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
		if (!data || data.length === 0) {
			return res.redirect('/login');
		} else {
			return next();
		}
	})
}

function ensureContent(req, res, next) {
	var outputPath = url.parse(req.url).pathname;

	if (req.session.measure) {
		var username = req.params.namekey ? req.params.namekey : req.session.measure;
		require('../models/measures.js')({collection: username}).find({}, function(err, data){
			if (err) {
				return next(err)
			}
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
			req.measurements = require('../models/measures.js')({collection: req.user.username});
			req.session.measure = req.user.username;
			return res.redirect('/api/'+req.user.username+'/0/false')
		} else {
			req.measurements = require('../models/measures.js')({collection: req.params.namekey});
			req.session.measure = req.params.namekey;
			return next();//res.redirect('/view/'+req.params.namekey)
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

router.get('/', function(req, res, next) {
	if (req.isAuthenticated()) {
		return res.redirect('/api/'+req.user.username+'/0/false')
	} else {
		return res.redirect('/login');
	}

})

router.get('/login', function(req, res, next){
	var outputPath = url.parse(req.url).pathname;
	return res.render('login', { 
		edit: null
	});
});

router.post('/login', passport.authenticate('local'/*, { session: false }*/), 
	function(req, res, next) {
	// If this function gets called, authentication was successful.
	// `req.user` contains the authenticated user.
	req.session.user = req.user;
	req.measurements = require('../models/measures.js')({collection: req.user.username})
	return res.redirect('/api/'+req.user.username+'/0/false');
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

router.get('/init/:namekey', ensureAuthenticated, function(req, res, next) {
	var outputPath = url.parse(req.url).pathname;
	//console.log(outputPath)
	async.waterfall([
		function(next){
			var username = req.user.username;
			req.measurements = require('../models/measures.js')({collection: username});
			req.measurements.find({}, function(err, data){
				if (err) {
					return next(err)
				}
				
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
				var lookup = ['bun', 'sdma', 'creatinine'];

				keys.forEach(function(key){
					var mea = new req.measurements({
						patient: req.user.username,
						key: key,
						data: [ 
							{
								name: key,
								index: 0,
								val: measurements[key],
								date: moment().utc().format(),
								high: getIntervalFor(key, 'us').interval[1],
								low: getIntervalFor(key, 'us').interval[0],
								unit: getIntervalFor(key, 'us').unit,
							} 
						],
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


router.get('/view/:namekey', ensureContent, ensureEmbeddedIndex, function(req, res, next){
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
					keys: keys,
					ce: false
				});
				
			})		
		}
		
	})
})

router.get('/daterange/:namekey/:begin/:end', ensureEmbeddedIndex, function(req, res, next){
	var namekey = req.params.namekey;
	var begin = req.params.begin;
	var end = req.params.end;
	//console.log(begin, end)
	require('../models/measures.js')({collection: namekey}).find({}).lean().exec(function(err, data){
		if (err) {
			return next(err)
		}
		var dates = data[0].data.map(function(doc){
			return doc.date;
		})
		var indexes = data[0].data.map(function(doc){
			return doc.index;
		})
		var skip, limit;
		var datearr = dates;
		dates.forEach(function(date, i){
			if (moment(date).utc().format() < begin) {
				indexes.splice(indexes.indexOf(i),1)
			}
		})
		datearr.sort();
		indexes.sort();
		skip = 0;
		limit = indexes.length;
		//console.log(skip, limit)
		req.measurements = require('../models/measures.js')({collection: namekey});
		req.measurements.aggregate([
			{
				$project: {
					patient: 1,
					key: 1,
					vis: 1,
					data: {
						$filter: {
							input: '$data',
							as: 'dat',
							cond: {
								$and: [
									{$gte:['$$dat.date', new Date(begin)]},
									{$lte:['$$dat.date', new Date(end)]}
								]
							}
						}
					}
				}
			}
		]).exec(function(err, result){
		//req.measurements.find({'data.date':{$gte: begin, $lte: end}}, { data: {$slice: [skip, limit] } }).lean().exec(function(err, result){
			if (err) {
				return next(err)
			}
			var dots = [];
			var keys = [];
			//result = result.toObject();
			//console.log(result)
			if (result[0].data.length === 0) {
				return res.redirect('/view/'+namekey)
			}
			for (var j in result) {
				for (var i in result[j].data) {
					var datObj = result[j].data[i];
					if (isNaN(Object.keys(datObj))) {
						dots.push(datObj)
					}
				}
				keys.push(result[j].key)
			}	
			return res.render('index', {
				index: result[0].data[result[0].data.length - 1].index,
				data: data,
				result: result,
				dots: dots,
				keys: keys,
				ce: true
			});
		})
	})
	
});

router.all('/api/*', require('connect-ensure-login').ensureLoggedIn());

router.get('/api/:namekey/:index/:edit', ensureContent, function(req, res, next){
	var outputPath = url.parse(req.url).pathname;
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
				var keys = [];
				for (var j in result) {
					for (var i in result[j].data) {
						var datObj = result[j].data[i];
						if (Object.keys(datObj).length) {
							dots.push(datObj)
						}
					}
					keys.push(result[j].key)
				}	
				return res.render('index', {
					index: req.params.index ? parseInt(req.params.index, 10) : result[0].data[result[0].data.length - 1].index,
					data: data,
					result: result,
					dots: dots,
					keys: keys,
					ce: true,
					edit: req.params.edit
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
		return res.send('ok');
	})
})

router.post('/reveal/:namekey/:key', ensureContent, function(req, res, next){
	var outputPath = url.parse(req.url).pathname;
	//console.log(outputPath) 
	var set = {$set:{}};
	var key = 'vis'
	set.$set[key] = true;
	require('../models/measures.js')({collection: req.params.namekey}).findOneAndUpdate({key: req.params.key}, set, {new: true, safe: true, multi: false}, function(err, result) {
		if (err) {
			return next(err)
		}
		//console.log(result)
		return res.send('ok')
	}) 
})

router.post('/hide/:namekey/:key', ensureContent, function(req, res, next){
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


router.post('/api/add/:namekey/:index', upload.array(), ensureContent, function(req, res, next){
	var body = req.body;
	var keys = Object.keys(body);
	var username = req.params.namekey;
	var index = parseInt(req.params.index, 10);
	req.measurements = require('../models/measures.js')({collection: username});

	req.measurements.find({}, function(err, data){
		if (err) {
			return next(err)
		}
		
		if (!err && data.length === 0) {
			return res.redirect('/')
			
		} else {
			req.measurements.find({'data.index': index}).lean().exec(function(err, measures) {
				if (err) {
					return next(err)
				}
				//console.log(measures)
				var date;
				var datestr = body.date.toString();
				if (!datestr.split('/')[1]) {
					
					date = new Date(body.date)
				} else {
					date = moment([datestr.split('/')[2], parseInt(datestr.split('/')[0], 10) - 1, datestr.split('/')[1]]).utc().format();
				}
				keys.splice(keys.indexOf('date'), 1);
				if (!err && measures.length === 0) {
					// new
					async.waterfall([
						function(cb){
							//get position
							req.measurements.find({}).lean().exec(function(err, data) {
								if (err) {
									cb(err)
								}
								for (var i in data[0].data) {
									if (data[0].data[i].date < date) {
										index = data[0].data[i].index;
									} else {
										index = index;
									}
								}
								cb(null, index, body, keys, username, date)
							})
						},
						function(index, body, keys, username, date, cb){
							var username = req.params.namekey;

							req.measurements = require('../models/measures.js')({collection: username});
							req.measurements.update({'data.index':{$gte: index}}, {$inc:{index:1}}, function(err, data){
								if (err) {
									next(err)
								}
								keys.forEach(function(key, i){
									var mea = {
										name: key,
										index: index,
										val: body[key],
										date: date,//new Date(date),
										high: getIntervalFor(key, 'us').interval[1],
										low: getIntervalFor(key, 'us').interval[0],
										unit: getIntervalFor(key, 'us').unit
									};
									req.measurements.findOneAndUpdate({key: key}, {$push:{data:mea}}, {safe: true, multi: false, upsert: false}, function(err, doc){
										if (err) {
											console.log(err)
										}
									})
								})
								cb(null)
							})
						}
					], function(err){
						if (err) {
							console.log(err)
						}
						return res.redirect('/api/'+data[0].patient+'/'+index+'/false')
					})
				} else {
					// edit
					keys.forEach(function(key, i){
						
						var query = {key: key, data:{$elemMatch:{index: index}}};
						var set = {$set:{}}
						var k = 'data.$.val'
						var d = 'data.$.date'
						set.$set[k] = body[key]
						set.$set[d] = moment(date).utc().format()
						req.measurements.findOneAndUpdate(query, set, {new: true, safe: true, upsert: false}, function(err, doc){
							if (err) {
								console.log(err)
							}
							//console.log(doc)
						})
					})
					return res.redirect('/api/'+data[0].patient+'/'+index+'/false')
				}
			})
		}
	})
})

module.exports = router;