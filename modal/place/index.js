var mongoose = require('mongoose');
var JOI = require('joi')

let placeSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        unique: true,
    },
    address:{
        type: String,
        required: true,
        unique: true,
    },
    country:{
        type: String,
        required: true,
        unique: false,
    },
    state:{
        type: String,
        required: true,
        unique: false,
    },
    city:{
        type: String,
        required: true,
        unique: false,
    },
    coordinates:{
        type: String,
        required: true,
        unique: false,
    },
    timings:{
        type: String,
        required: true,
        unique: false,
    },
    images:{
        type: Array,
        require: false,
        unique: false
    },
    status:{
        type: Boolean,
        required: true,
    }
});
const place = mongoose.model('places', placeSchema, 'places');
module.exports = place;