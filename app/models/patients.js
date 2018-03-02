var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
		Measure = require('./measures.js'),
		passportLocalMongoose = require('passport-local-mongoose');

var Patient = new Schema({
	name: String,
	password: String,
	username: {
		type: String,
		unique: true,
		required: true,
	},
	measurements: [
		Measure
	]
}, { collection: 'ckd' });

Patient.plugin(passportLocalMongoose);
module.exports = mongoose.model('Patient', Patient);