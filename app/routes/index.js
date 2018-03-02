var express = require('express');
var Measure = require('../models/measures');
var Patient = require('../models/patients');
var multer  = require('multer');
var moment = require('moment');
var _ = require('underscore');
var url = require('url');
var dotenv = require('dotenv');
var async = require("async");
var router = express.Router();

var upload = multer();

dotenv.load();

router.get('/', function(req, res, next) {
	req.session.data = null;
	if (req.session.data) {
		return res.render('index', {
			data: req.session.data,
			dots: req.session.dots
		})
	} else {
		Patient.find({}, function(err, data){
			if (err) {
				return next(err)
			}
			if (data.length === 0) {
				return res.redirect('/api/init');
			}
			Patient.aggregate([
				{
					$project: {
						measurements: {
							$filter: {
								input: '$measurements',
								as: 'measurements',
								cond: { $ne: ['$$measurements.vis', false] }
							}
						}
					}
				}
			]).exec(function(err, results) {
				if (err) {
					return next(err)
				}
				var dots = [];
				var result = results[0]
				console.log(result.measurements[0].data)
				Patient.findOne({key: result.measurements[0].patient}, function(err, doc){
					if (err) {
						return next(err)
					}
					//result = result.toObject();
					for (var j in result.measurements) {
						for (var i in result.measurements[j].data) {
							var datObj = result.measurements[j].data[i];
							if (Object.keys(datObj).length) {
								dots.push(datObj)
							}
						}
					}	
					result.key = doc.key;
					return res.render('index', {
						index: result.measurements[0].data[result.measurements[0].data.length - 1].index,
						data: result,
						dots: dots,
						keys: Object.keys(result.measurements)
					});
				})
				
			})
		})
	}
})

router.post('/api/reveal/:namekey/:key', function(req, res, next){
	//Patient.findOne({key: req.params.namekey}, {measurements: {$elemMatch:{key: {$in: req.params.keys}}}}, function(err, doc){
	var set = {$set:{}};
	var key = 'measurements.$.'+ req.params.key +'.vis'
	set.$set[key] = true;
	Patient.findOneAndUpdate({key: req.params.namekey, measurements:{key: req.params.key}}, set, {new: true, safe: true}, function(err, result) {
		if (err) {
			return next(err)
		}
		return res.send('ok')
	}) 
})

router.post('/api/hide/:namekey/:key', function(req, res, next){
	//Patient.findOne({key: req.params.namekey}, {measurements: {$elemMatch:{key: {$in: req.params.keys}}}}, function(err, doc){
	var set = {$set:{}};
	var key = 'measurements.$.'+ req.params.key +'.vis'
	set.$set[key] = false;
	Patient.findOneAndUpdate({key: req.params.namekey, measurements:{key: req.params.key}}, set, {new: true, safe: true}, function(err, result) {
		if (err) {
			return next(err)
		}
		return res.send('ok')
	}) 
})
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

router.get('/api/init', function(req, res, next) {
	Patient.find({}, function(err, data){
		if (err) {
			return next(err)
		}
		if (data.length > 0) {
			return res.redirect('/');
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
		var keys = Object.keys(measurements);
		
		var measurementdata = [];
		var lookup = ['bun', 'sdma', 'na_k_ratio'];
		keys.forEach(function(key){
			measurementdata.push({
				patient: 'sophia_bushman',
				key: key,
				data: [ 
					{
						name: key,
						index: 0,
						val: measurements[key],
						date: moment('2017-08-01').utc().format()
					} 
				],
				high: getIntervalFor(key, 'us').interval[1],
				low: getIntervalFor(key, 'us').interval[0],
				unit: getIntervalFor(key, 'us').unit,
				vis: lookup.indexOf(key) !== -1 ? true : false
				
			});
		})
		
		var patient = new Patient({
			name: 'Sophia',
			key: 'sophia_bushman',
			measurements: measurementdata
		});
		patient.save(function(err) {
			if (err) {
				return next(err)
			}
			return res.redirect('/')
		})
	})
})


/*
{
    "identifier": "AAPL",
    "item": "totalrevenue",
    "result_count": 30,
    "page_size": 50000,
    "current_page": 1,
    "total_pages": 1,
    "api_call_credits": 1,
    "data": [
        {
            "date": "2016-06-25",
            "value": 220288000000.0
        },
        {
            "date": "2016-03-26",
            "value": 227535000000.0
        },
        ...
    ]
}*/


router.post('/api/add/:namekey/:index', upload.array(), function(req, res, next){
	var body = req.body;
	//console.log(req)
	var keys = Object.keys(body);
	console.log(keys)
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
	//var keys = Object.keys(measurements);
	Patient.findOne({key: req.params.namekey}, function(err, doc){
		if (err) {
			return next(err)
		}
		
		if (!err && doc === null) {
			return res.redirect('/')
			
		} else {
			var projection
			Patient.findOne({key: req.params.namekey, measurements: {$elemMatch: {'data.date': body.date}}}, function(err, measures) {
				if (err) {
					return next(err)
				}
				var date = body.date
				keys.splice(keys.indexOf('date'), 1);
				var dockeys = Object.keys(measurements);
				if (!err && measures === null) {
					// new
					async.waterfall([
						function(cb){
							doc = doc.toObject();
							keys.forEach(function(key, i){
								var ind = dockeys.indexOf(key)
								
								var meas = doc.measurements[dockeys.indexOf(key)];
								
								if (meas.key === key) {
									console.log(meas.key, key, doc.measurements[ind])
									var measurenew = {
										name: key,
										index: doc.measurements[ind].data.length,
										val: body[key],
										date: date
									}
									doc.measurements[ind].data.push(measurenew)
								}
								
							})
							cb(null, doc)
						}
					], function(err, doc){
						if (err) {
							console.log(err)
						}
						Patient.findOneAndUpdate({key: doc.key}, {$set:{measurements:JSON.parse(JSON.stringify(doc.measurements))}}, {safe: true, new: true, multi: false}, function(err, doc){
							if (err) {
								return next(err)
							}
							return res.redirect('/')
						})
						
					})
					
					
					
					
				} else {
					Object.keys(body).forEach(function(key, i){
						
						var query = {key: req.params.namekey, measurements: {$elemMatch: {'data.date': body.date}}};
						var set = {$set:{}}
						var k = 'measurements.$.data.'+parseInt(req.params.index, 10)+'.val'
						set.$set[k] = body[key]
						Patient.findOneAndUpdate(query, set, {new: true, safe: true, multi: true}, function(err, doc){
							if (err) {
								return next(err)
							}
							return res.redirect('/')
						})
					})
					
				}
				
				
			})
			
			
		}
		
	})
})

module.exports = router;