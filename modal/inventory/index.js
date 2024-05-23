var mongoose = require('mongoose');

let inventorySchema = new mongoose.Schema({
    productId:{
        type: mongoose.Types.ObjectId,
        required: true,
        unique: false,
    },
    packages:{
        type: mongoose.Schema.Types.Mixed,
        required: true,
        unique: false,
    },
    updatedAt:{
        type: String,
        required: false,
        unique: false,
    },
});

const inventory = mongoose.model('inventory', inventorySchema, 'inventory');
module.exports = inventory;