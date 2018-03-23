var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
		passportLocalMongoose = require('passport-local-mongoose');

var Publisher = new Schema({
	givenName: String,
	password: String,
	username: {
		type: String,
		required: true
	}
}, { collection: 'ckd' });

Publisher.plugin(passportLocalMongoose, {usernameField: 'username'});
module.exports = mongoose.model('Publisher', Publisher);