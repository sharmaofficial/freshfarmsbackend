const express = require('express');
const { addPlace, updatePlace, deletePlace, uploadImage } = require('../../controller/place');
var router = express.Router();
var {add, del, update, login, register, upload, addAddress, updateAddress, deleteAddress} = require('../../controller/user');
const { getProducts, getProduct } = require('../../controller/product');
const { createOrder, verifyOrder } = require('../../controller/order');
const { getLatestQuantityFromPackage } = require('../../controller/inventory');

router.post('/createOrder', createOrder);
router.post('/verifyOrder', verifyOrder);
router.post('/add', add);
router.post('/addAddress', addAddress);
router.post('/updateAddress', updateAddress);
router.post('/deleteAddress', deleteAddress);
router.post('/getProductsList', getProducts);
router.post('/getProduct', getProduct);
router.post('/delete/:id', del);
router.post('/update', update);
router.post('/login', login);
router.post('/register', register);
router.post('/upload', upload);
router.post('/add-place', addPlace);
router.post('/update-place/:id', updatePlace);
router.post('/uploadImage', uploadImage);
router.post('/getQuantity', getLatestQuantityFromPackage);

router.delete('/delete-place/:id', deletePlace);



module.exports = router;