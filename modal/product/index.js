var mongoose = require('mongoose');
var JOI = require('joi')

let productSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        unique: false,
    },
    categoryId:{
        type: Number,
        required: true,
        unique: false,
    },
    description:{
        type: String,
        required: true,
        unique: false,
    },
    estimated_delivery:{
        type: String,
        required: true,
        unique: false,
    },
    id:{
        type: Number,
        required: true,
        unique: false,
    },
    images:{
        type: Array,
        required: true,
        unique: false,
    },
    isActive:{
        type: Boolean,
        required: true,
        unique: false,
    },
    packaging_type:{
        type: String,
        require: true,
        unique: false
    },
    packaging_weight:{
        type: String,
        require: true,
        unique: false
    },
    price:{
        type: Number,
        require: true,
        unique: false
    }
});
const products = mongoose.model('products', productSchema, 'products');
module.exports = products;