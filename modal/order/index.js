var mongoose = require('mongoose');

let ordersSchema = new mongoose.Schema({
    address:{
        type: mongoose.Schema.Types.Mixed,
        required: true,
        unique: false,
    },
    products:{
        type: mongoose.Schema.Types.Array,
        required: true,
        unique: false,
    },
    userId:{
        type: String,
        required: true,
        unique: false,
    },
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
    transactionId:{
        type: String,
        required: false,
        unique: false,
    },
    totalAmout:{
        type: Number,
        required: true,
        unique: false,
    },
    isPaid:{
        type: Boolean,
        required: true,
        unique: false,
    },
    paymentDetails:{
        type: mongoose.Schema.Types.Mixed,
        required: true,
        unique: false,
    },
});

const orders = mongoose.model('orders', ordersSchema, 'orders');
module.exports = orders;