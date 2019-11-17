var mongoose = require ('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    duration: {type: Number, required: true},
    temperature: {type: Number, required: true},
});

module.exports = mongoose.model('BoostConfig', schema);
