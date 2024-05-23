const express = require('express');
const { cancelOrder } = require('../../controller/order');
var router = express.Router();

router.post(`/cancelOrder`, cancelOrder);

module.exports = router;