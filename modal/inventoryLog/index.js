var mongoose = require('mongoose');

let inventoryLogSchema = new mongoose.Schema({
    orderId:{
        type: String,
        required: true,
        unique: false,
    },
    dateTime:{
        type: String,
        required: true,
        unique: false,
    },
    orderType:{
        type: String,
        required: true,
        unique: false,
    }
});

const inventoryLog = mongoose.model('inventoryLog', inventoryLogSchema, 'inventoryLog');
module.exports = inventoryLog;