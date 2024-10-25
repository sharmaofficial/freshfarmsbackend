const express = require('express');
var router = express.Router();
const { addPlace, updatePlace, deletePlace, uploadImage } = require('../../controller/place');
var {add, del, update, userUpdateAdmin, login, register, uploadProfilePicture, addAddress, updateAddress, deleteAddress, markDefaultAddress, forgotPassword, verifyOTP, updatePassword, myOrders, adminLogin, updateUserStatusAdmin, updatePasswordWithoutAuth, loginWithAppWrite, verifyOtpWithAppWrite} = require('../../controller/user');
const { getProducts, getProduct, addProduct, editProduct, getAllProductsForAdmin } = require('../../controller/product');
const { createOrder, verifyOrder, verifyPaymentHook, getOrderStatus, updateOrderStatus, getOrder, cancelOrder, calculateDeliveryCharges } = require('../../controller/order');
const { getLatestQuantityFromPackage, updateStock, updateProductPackageStatus } = require('../../controller/inventory');
const { addCategory, editCategory, deleteCategory } = require('../../controller/category');
const { addPackage, editPackage, getPackageByProductId } = require('../../controller/packageType');
const multer = require("multer");
const upload = multer();
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
router.post('/updatePasswordWithoutAuth', updatePasswordWithoutAuth);
router.post('/uploadProfilePicture', uploadProfilePicture);
router.post('/add-place', addPlace);
router.post('/update-place/:id', updatePlace);
router.post('/uploadImage', uploadImage);
router.post('/getQuantity', getLatestQuantityFromPackage);
router.delete('/delete-place/:id', deletePlace);
router.post('/myOrders', myOrders);
router.post('/verifyPaymentHook', verifyPaymentHook);
router.post('/getOrderStatus', getOrderStatus);
router.post(`/cancelOrder`, cancelOrder);
router.post(`/loginWithAppWrite`, loginWithAppWrite);
router.post(`/verifyOtpWithAppWrite`, verifyOtpWithAppWrite);
router.post('/calculateDeliveryCharges', calculateDeliveryCharges);

//admin
router.post('/admin/login', adminLogin);
router.post('/admin/addProduct', upload.single("image"), addProduct);
router.post('/admin/addCategory', upload.single("image"), addCategory);
router.post('/admin/editCategory', upload.single("image"), editCategory);
router.post('/admin/deleteCategory', deleteCategory);
router.post('/admin/editProduct', editProduct);
router.post('/admin/updateOrderStatus', updateOrderStatus);
router.post('/admin/getOrder', getOrder);
router.post('/admin/addPackage', addPackage);
router.post('/admin/editPackage', editPackage);
router.post('/admin/editUser', userUpdateAdmin);
router.post('/admin/updateUserStatus', updateUserStatusAdmin);
router.post('/admin/getPackageByProductId', getPackageByProductId);
router.post('/admin/updateStock', updateStock);
router.post('/admin/updateProductPackageStatus', updateProductPackageStatus);

module.exports = router;