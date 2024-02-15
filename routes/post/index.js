const express = require('express');
var router = express.Router();
const { addPlace, updatePlace, deletePlace, uploadImage } = require('../../controller/place');
var {add, del, update, login, register, uploadProfilePicture, addAddress, updateAddress, deleteAddress, markDefaultAddress, forgotPassword, verifyOTP, updatePassword, myOrders, adminLogin} = require('../../controller/user');
const { getProducts, getProduct, addProduct, editProduct } = require('../../controller/product');
const { createOrder, verifyOrder, verifyPaymentHook, getOrderStatus } = require('../../controller/order');
const { getLatestQuantityFromPackage } = require('../../controller/inventory');
const { addCategory, editCategory } = require('../../controller/category');

router.post('/createOrder', createOrder);
router.post('/verifyOrder', verifyOrder);
router.post('/add', add);
router.post('/addAddress', addAddress);
router.post('/updateAddress', updateAddress);
router.post('/deleteAddress', deleteAddress);
router.post('/markDefaultAddress', markDefaultAddress);
router.post('/getProductsList', getProducts);
router.post('/getProduct', getProduct);
router.post('/delete/:id', del);
router.post('/update', update);
router.post('/login', login);
router.post('/register', register);
router.post('/forgotPassword', forgotPassword);
router.post('/verifyOTP', verifyOTP);
router.post('/updatePassword', updatePassword);
router.post('/uploadProfilePicture', uploadProfilePicture);
router.post('/add-place', addPlace);
router.post('/update-place/:id', updatePlace);
router.post('/uploadImage', uploadImage);
router.post('/getQuantity', getLatestQuantityFromPackage);
router.delete('/delete-place/:id', deletePlace);
router.post('/myOrders', myOrders);
router.post('/verifyPaymentHook', verifyPaymentHook);
router.post('/getOrderStatus', getOrderStatus);

//admin
router.post('/admin/login', adminLogin);
router.post('/admin/addProduct', addProduct);
router.post('/admin/addCategory', addCategory);
router.post('/admin/editCategory', editCategory);
router.post('/admin/editProduct', editProduct);

module.exports = router;