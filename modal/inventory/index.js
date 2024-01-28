var mongoose = require('mongoose');

let inventorySchema = new mongoose.Schema({
    productId:{
        type: Number,
        required: true,
        unique: false,
    },
    packages:{
        type: Array,
        required: true,
        unique: false,
    },
});

const inventory = mongoose.model('inventory', inventorySchema, 'inventory');
module.exports = inventory;