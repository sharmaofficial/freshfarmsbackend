const express = require('express');
const { addPlace, updatePlace, deletePlace, uploadImage } = require('../../controller/place');
var router = express.Router();
var {add, del, update, login, register, uploadProfilePicture, addAddress, updateAddress, deleteAddress, markDefaultAddress, forgotPassword, verifyOTP, updatePassword, myOrders} = require('../../controller/user');
const { getProducts, getProduct } = require('../../controller/product');
const { createOrder, verifyOrder } = require('../../controller/order');
const { getLatestQuantityFromPackage } = require('../../controller/inventory');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'asset/image/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    },
});
const upload = multer({ storage: storage });

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
router.post('/update', upload.single('profilePicture'), update);
router.post('/login', login);
router.post('/register', register);
router.post('/forgotPassword', forgotPassword);
router.post('/verifyOTP', verifyOTP);
router.post('/updatePassword', updatePassword);
router.post('/uploadProfilePicture', upload.single('profilePicture'), uploadProfilePicture);
router.post('/add-place', addPlace);
router.post('/update-place/:id', updatePlace);
router.post('/uploadImage', uploadImage);
router.post('/getQuantity', getLatestQuantityFromPackage);
router.delete('/delete-place/:id', deletePlace);
router.post('/myOrders', myOrders);

module.exports = router;