var mongoose = require('mongoose');

let packageTypeSchema = new mongoose.Schema({
    id:{
        type: String,
        required: true,
        unique: false,
    },
    name:{
        type: Number,
        required: true,
        unique: false,
    },
    isActive:{
        type: Boolean,
        required: true,
        unique: false,
    },
});

const packageType = mongoose.model('packageType', packageTypeSchema, 'packageType');
module.exports = packageType;