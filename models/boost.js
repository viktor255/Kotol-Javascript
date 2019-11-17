var mongoose = require ('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    time: {type: Number, required: true},
    duration: {type: Number, required: true},
    temperature: {type: Number, required: true},
    author: {type: String, required: true}
});

module.exports = mongoose.model('Boost', schema);
