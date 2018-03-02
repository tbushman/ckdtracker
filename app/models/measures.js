var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Measure = new Schema({
	patient: String,
	key: String,
	data: [{
		name: String,
		index: Number,
		val: Number,
		date: Date
	}],
	high: Number,
	low: Number,
	unit: String,
	vis: Boolean
}, {pluralize: false});


module.exports = function(db){ 
	console.log(db)
	return mongoose.model(db.collection, Measure, db.collection);
}