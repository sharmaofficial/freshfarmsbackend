var mongoose = require('mongoose');

let productSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        unique: false,
    },
    categoryId:{
        type: mongoose.Types.ObjectId,
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
    images:{
        type: Array,
        required: false,
        unique: false,
    },
    isActive:{
        type: Boolean,
        required: true,
        unique: false,
    },
    coverImage:{
        type: String,
        required: true,
        unique: false,
    },
    price:{
        type: Number,
        required: false,
        unique: false,
    },
    shopName:{
        type: String,
        required: true,
        unique: false,
    }
});
const products = mongoose.model('products', productSchema, 'products');
module.exports = products;