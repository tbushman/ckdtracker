var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
		Measure = require('./measures.js');

var Patient = new Schema({
	name: String,
	key: {
		type: String,
		unique: true,
		required: true,
	},
	measurements: [
		Measure
	]
}, { collection: 'ckd' });


module.exports = mongoose.model('Patient', Patient);