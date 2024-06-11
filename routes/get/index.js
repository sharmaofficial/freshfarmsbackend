const express = require('express');
var router = express.Router();
var {list, details, myOrders, getAddresses} = require('../../controller/user');
const { placeList } = require('../../controller/place');
const { getOrders } = require('../../controller/order');
const { getCategories, getCategoriesForAdmin } = require('../../controller/category');
const { getPackages } = require('../../controller/packageType');
const { getAllProductsForAdmin } = require('../../controller/product');
const { getInventoryLog } = require('../../controller/inventoryLog');
const { getPrivacypolicy } = require('../../controller/policy');

router.get('/addresses', getAddresses);
router.get('/', list);
router.get('/getCategories', getCategories);
router.get('/getOrders', getOrders);
router.get('/getplaces', placeList);
router.get('/getPrivacypolicy', getPrivacypolicy);
router.get('/:id', details);
//admin
router.get('/admin/getPackages', getPackages);
router.get('/admin/getOrders', getOrders);
router.get('/admin/getInventoryLog', getInventoryLog);
router.get('/admin/getCategories', getCategoriesForAdmin);
router.get('/admin/getProducts', getAllProductsForAdmin);

module.exports = router;