var mongoose = require('mongoose');

let categoriesSchema = new mongoose.Schema({
    id:{
        type: Number,
        required: true,
        unique: false,
    },
    image:{
        type: String,
        required: true,
        unique: false,
    },
    name:{
        type: String,
        required: true,
        unique: false,
    },
    isActive:{
        type: Boolean,
        required: true,
    }
});

const categories = mongoose.model('categories', categoriesSchema, 'categories');
module.exports = categories;