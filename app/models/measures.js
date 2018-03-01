var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Measure = new Schema({
	patient: String,
	key: String,
	data: [{
		name: String,
		val: Number,
		date: Date
	}],
	high: Number,
	low: Number,
	unit: String,
	vis: Boolean
});


module.exports = Measure;