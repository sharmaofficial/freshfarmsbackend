const express = require('express');
var router = express.Router();
var {list, details, myOrders} = require('../../controller/user');
const { placeList } = require('../../controller/place');
const { getOrders } = require('../../controller/order');
const { getCategories } = require('../../controller/category');
const { getPackages } = require('../../controller/packageType');

router.get('/', list);
router.get('/getCategories', getCategories);
router.get('/getOrders', getOrders);
router.get('/getplaces', placeList);
router.get('/:id', details);

//admin
router.get('/admin/getPackages', getPackages);


module.exports = router;