var mongoose = require('mongoose');

let packageTypeSchema = new mongoose.Schema({
    name:{
        type: Number,
        required: true,
        unique: false,
    },
    isActive:{
        type: Boolean,
        required: true,
        unique: false,
    }
});

const packageType = mongoose.model('packageType', packageTypeSchema, 'packageType');
module.exports = packageType;