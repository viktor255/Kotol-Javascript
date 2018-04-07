var mongoose = require ('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    time: {type: String, required: true},
    temperature: {type: Number, required: true}
});

module.exports = mongoose.model('CurrentTimeConfig', schema);