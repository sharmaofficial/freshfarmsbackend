const inventory = require("../../modal/inventory")
const inventoryLog = require("../../modal/inventoryLog")
const ordersSchema = require("../../modal/order");
const userSchema = require("../../modal/user");
const { getUniqueId,adminInstance, sendOrderEmail } = require("../../utils");
const crypto = require('crypto');

const { Cashfree } = require("cashfree-pg");
const { ObjectId } = require("mongodb");
const { databases, users } = require("../../database");
const { ID, Query } = require("node-appwrite");
const Razorpay = require("razorpay");

Cashfree.XClientId = process.env.XClientId;
Cashfree.XClientSecret = process.env.XClientSecret;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.getOrders = async(req, res, next) => {
    try {
        const orders = await databases.listDocuments(
            process.env.dbId,
            process.env.orderCollectID,
        )
        if(orders.total){
            return res.send({status: 1, message:'Orders list fetched', data: orders.documents});
        }else{
            return res.send({status: 0, message:'No orders found', data: []});
        }
    } catch (error) {
        res.send({status: 0, message: `Error while fetching orders - ${error}`, data: null});
    }
}

exports.getOrder = async(req, res, next) => {
    try {
        const id = req.body.id;
        if(id){
            const response = await ordersSchema.findOne({_id: id});
            if(response){
                res.send({data: response, message: 'Order details fetched', status: 1});
            }else{
                res.send({data: null, message: 'Order not found', status: 1});
            }
        }else{
            res.send({data: null, message: 'Please send order id', status: 1});
        }

    } catch (error) {
        res.send({data: null, message: 'Error while fetching order details', status: 0});
    }

}

exports.getOrderStatus = async(req, res, next) => {
    try {
        const response = await databases.listDocuments(
            process.env.dbId,
            process.env.orderCollectID,
            [
                Query.equal("orderId", req.body.orderId)
            ]
        )
        if(response.total){
            res.send({status: 1, message:'', data: response.documents[0]})
        }else{
            res.send({status: 1, message:'Order not found', data: null})
        }
    } catch (error) {
        res.send({status: 0, message:error.message, data: null})
    }
}

exports.createOrder = async(req, res, next) => {
    // const createCFOrderId = (request, successCallback, errorCallback) => {
    //     // let request = {
    //     //     order_amount: 1,
    //     //     order_currency: "INR",
    //     //     order_id: orderId,
    //     //     customer_details: {
    //     //         customer_id: "walterwNrcMi",
    //     //         customer_phone: "9999999999"
    //     //     },
    //     //     order_meta: {
    //     //         return_url: `https://www.cashfree.com/devstudio/preview/pg/web/checkout?order_id=${orderId}`
    //     //     }
    //     // };
    //     // console.log("request", request);
    //     Cashfree.PGCreateOrder("2022-09-01", request).then((response) => {
    //         console.log('Order Created successfully:',response.data)
    //         successCallback(response.data);
    //     }).catch((error) => {
    //         console.error('Error:', error);
    //         errorCallback(error);
    //     });
    // }

    // try {
    //     const orderId = getUniqueId();
    //     const address = JSON.parse(req.body?.address)
    //     let payload = {
    //         ...req.body,
    //         orderId: orderId,
    //         isPaid: false,
    //         orderStatus: 'Processing',
    //         userId: req.userId,
    //         updatedAt: new Date(),
    //         dateTime: new Date()
    //     }
    //     console.log("payload", payload);
    //     await databases.createDocument(
    //         process.env.dbId,
    //         process.env.orderCollectID,
    //         ID.unique(),
    //         {
    //             ...payload
    //         }
    //     )
    //     createCFOrderId(
    //         {
    //             order_id: orderId,
    //             order_amount: req.body.totalAmout,
    //             order_currency: "INR",
    //             customer_details: {
    //                 customer_id: req.userId,
    //                 customer_phone: address?.contactNumber.toString() || "",
    //                 customer_name: address?.name || ""
    //             }
    //         },
    //         (response) => {
    //             res.send({status: 1, message:'Orders Created', data: response});
    //         },
    //         error => {
    //             res.send({status: 0, message:'Orders Creation failed - ' + error.message, data: null});
    //         }
    //     )
    // } catch (error) {
    //     console.log("error", error);
    //     res.send({status: 0, message: `Orders creation failed - ${error.message}` , data: null});
    // }

    try {
        console.log("req.body", req.body);
        const { totalAmout, userId } = req.body;
        const options = {
          amount: totalAmout * 100, // Convert amount to paise
          currency: 'INR',
          customer_id: userId
        };
        const orderId = getUniqueId();
        let payload = {
            ...req.body,
            orderId: orderId,
            isPaid: false,
            orderStatus: 'Processing',
            userId: req.userId,
            updatedAt: new Date(),
            dateTime: new Date()
        }
        const order = await databases.createDocument(
            process.env.dbId,
            process.env.orderCollectID,
            ID.unique(),
            {
                ...payload
            }
        )
        const response = await razorpayInstance.orders.create({...options});
        return res.send({message: `Order created succefully`, status: 1, data: {...response, razorpay_key: process.env.RAZORPAY_KEY, documentId: order.$id}});
    } catch (error) {
        console.log("error", error);
        return res.send({message: `Order creation failed - ${error.message}`, status: 0, data: null});
    }
}

exports.verifyOrder = async(req, res, next) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, options, documentId } = req.body;

  const secret = razorpayInstance.key_secret;
  const body = razorpay_order_id + '|' + razorpay_payment_id;

  console.log("req.body", req.body);

  try {
    const isValidSignature = Razorpay.validateWebhookSignature(body, razorpay_signature, secret);
    console.log("isValidSignature", isValidSignature);
    if (isValidSignature) {
        const transaction = await databases.createDocument(
            process.env.dbId,
            process.env.transactionCollectID,
            ID.unique(),
            {
                transactionDetails: JSON.stringify({
                    ...options
                })
            }
        )
        const order = await databases.listDocuments(
            process.env.dbId,
            process.env.orderCollectID,
            [
                Query.equal("$id", [documentId])
            ]
        )
        if(order.total){
            await databases.updateDocument(
                process.env.dbId,
                process.env.orderCollectID,
                order.documents[0].$id,
                {
                    transactionId: transaction.$id,
                    isPaid: true

                }
            );
            const products = JSON.parse(order.documents[0].products)
            products.forEach(async product => {
                const invetory = await databases.listDocuments(
                    process.env.dbId,
                    process.env.inventoryCollectID,
                    [
                        Query.equal("productId", product.$id)
                    ]
                )
                const {quantity} = product;
                const {quantity: currentQuantity} = invetory.documents[0]

                let updateQuantity = Number(currentQuantity)-Number(quantity);

                await databases.updateDocument(
                    process.env.dbId,
                    process.env.inventoryCollectID,
                    invetory.documents[0].$id,
                    {
                        quantity: Number(updateQuantity)
                    }
                );
                await databases.createDocument(
                    process.env.dbId,
                    process.env.inventoryLogCollectID,
                    ID.unique(),
                    {
                        orderId: order.documents[0].$id,
                        createdAt: new Date(),
                        orderType: 'SELL'
                    }
                )
            });
            
            //SEND Notification to app using firebase messaging
            const userDetails = await databases.listDocuments(
                process.env.dbId,
                process.env.tokenCollectID,
                [
                    Query.equal("userId", order.documents[0].userId)
                ]
            )
            if(userDetails.documents[0]?.fcmToken){
                await adminInstance.messaging().send({
                    data: {
                      title: `Order Placed Successfully !`,
                      body: `Order is placed and in processing, hang tight we will deliver it soon !
                            \n Your Order id is: ${order.documents[0].$id}`,
                    },
                    token: userDetails.documents[0]?.fcmToken,
                });
                const user = await users.get(order.documents[0].userId);
                console.log("user", user.email);
                sendOrderEmail(user.email, order.documents[0].$id);
            }
            res.send({status: 1, message:'Orders placed successfully', data: order.documents[0].orderId})
        }else{
            return res.send({status: 0, message:'Order not found', data: null})
        }
    } else {
        const transaction = await databases.createDocument(
            process.env.dbId,
            process.env.transactionCollectID,
            ID.unique(),
            {
                transactionDetails: JSON.stringify({
                    ...options
                })
            }
        )
        const order = await databases.listDocuments(
            process.env.dbId,
            process.env.orderCollectID,
            [
                Query.equal("$id", [documentId])
            ]
        )
        if(order.total){
            await databases.updateDocument(
                process.env.dbId,
                process.env.orderCollectID,
                order.documents[0].$id,
                {
                    transactionId: transaction.$id,
                    isPaid: false
                }
            );
            res.send({status: 0, message:'Payment verification failed', data:  order.documents[0].orderId});
        }else{
            return res.send({status: 0, message:'Order not found', data: null})
        }
    }
  } catch (error) {
    console.error(error);
    return res.send({status: 0, message:'Payment verification failed', data: null})
  }
    // Cashfree.PGFetchOrder("2022-09-01", req.body.orderId).then(async (response) => {
    //     const orderId = req.body.orderId
    //     if(response.data.order_status === 'PAID'){
    //         const transaction = await databases.createDocument(
    //             process.env.dbId,
    //             process.env.transactionCollectID,
    //             ID.unique(),
    //             {
    //                 transactionDetails: JSON.stringify({
    //                     ...response.data
    //                 })
    //             }
    //         )
    //         const order = await databases.listDocuments(
    //             process.env.dbId,
    //             process.env.orderCollectID,
    //             [
    //                 Query.equal("orderId", [orderId])
    //             ]
    //         )
    //         if(order.total){
    //             await databases.updateDocument(
    //                 process.env.dbId,
    //                 process.env.orderCollectID,
    //                 order.documents[0].$id,
    //                 {
    //                     transactionId: transaction.$id,
    //                     isPaid: true

    //                 }
    //             );
    //             const products = JSON.parse(order.documents[0].products)
    //             products.forEach(async product => {
    //                 const invetory = await databases.listDocuments(
    //                     process.env.dbId,
    //                     process.env.inventoryCollectID,
    //                     [
    //                         Query.equal("productId", product.$id)
    //                     ]
    //                 )
    //                 const {quantity} = product;
    //                 const {quantity: currentQuantity} = invetory.documents[0]

    //                 let updateQuantity = Number(currentQuantity)-Number(quantity);

    //                 await databases.updateDocument(
    //                     process.env.dbId,
    //                     process.env.inventoryCollectID,
    //                     invetory.documents[0].$id,
    //                     {
    //                         quantity: Number(updateQuantity)
    //                     }
    //                 );
    //                 await databases.createDocument(
    //                     process.env.dbId,
    //                     process.env.inventoryCollectID,
    //                     ID.unique(),
    //                     {
    //                         orderId: order.documents[0].$id,
    //                         createdAt: new Date(),
    //                         orderType: 'SELL'
    //                     }
    //                 )
    //             });
                
    //             //SEND Notification to app using firebase messaging
    //             const userDetails = await databases.listDocuments(
    //                 process.env.dbId,
    //                 process.env.tokenCollectID,
    //                 [
    //                     Query.equal("userId", order.documents[0].userId)
    //                 ]
    //             )
    //             if(userDetails.documents[0]?.fcmToken){
    //                 await adminInstance.messaging().send({
    //                     data: {
    //                       title: `Order Placed Successfully !`,
    //                       body: `Order is placed and in processing, hang tight we will deliver it soon !
    //                             \n Your Order id is: ${orderId}`,
    //                     },
    //                     token: userDetails.documents[0]?.fcmToken,
    //                 });
    //             }
    //             res.send({status: 1, message:'Orders placed successfully', data: order.documents[0].orderId})
    //         }else{
    //             res.send({status: 0, message:'Order not found', data: null})
    //         }
    //         // const condition = {
    //         //     'orderId': orderId,
    //         // };
    //         // const update = {
    //         //     $set: {
    //         //         'isPaid': true,
    //         //         'paymentDetails': {...response.data},
    //         //         // 'orderStatus': response.data.order_status
    //         //     },
    //         // };
    //         // await ordersSchema.findOneAndUpdate(condition, update, { new: true });
    //         // updateInventory(orderId, res, req, (error) => {
    //         //     res.send({status: 0, message:'Error while updating inventory', data: null, error: error})
    //         // });
    //     }else{
    //         const transaction = await databases.createDocument(
    //             process.env.dbId,
    //             process.env.transactionCollectID,
    //             ID.unique(),
    //             {
    //                 transactionDetails: JSON.stringify({
    //                     ...response.data
    //                 })
    //             }
    //         )
    //         const order = await databases.listDocuments(
    //             process.env.dbId,
    //             process.env.orderCollectID,
    //             [
    //                 Query.equal("orderId", [req.body.orderId])
    //             ]
    //         )
    //         if(order.total){
    //             await databases.updateDocument(
    //                 process.env.dbId,
    //                 process.env.orderCollectID,
    //                 order.documents[0].$id,
    //                 {
    //                     transactionId: transaction.$id,
    //                     isPaid: false
    //                 }
    //             );
    //             res.send({status: 1, message:'Orders payment pending', data: response.data});
    //         }else{
    //             res.send({status: 0, message:'Order not found', data: null})
    //         }
    //     }
    // }).catch((error) => {
    //     console.error('Error:', error);
    //     res.send({status: 0, message:'Error while verifying order payment', data: null});
    // });
}

const updateInventory = async(orderId, res, req, errorCallback) => {
    let orderDetails;
    try {
        orderDetails = await ordersSchema.findOne({orderId: orderId});
        orderDetails.products.map(item => {
            //item.id is product id
            //item.packageType is pachakeType id
            getInventoryStock(
                item._id, 
                item.packageType.id,
                (currentQuantity) => {
                    const updateStock = currentQuantity - item.quantity;
                    upadateInventoryWithNewStock(
                        updateStock,
                        item.packageType.id,
                        () => {
                            updateInvetoryLog(orderId,async () => {
                                const user = await userSchema.findOne({_id: req.userId});
                                if(user.data.fcmToken){
                                    await adminInstance.messaging().send({
                                        data: {
                                          title: `Order Placed Successfully !`,
                                          body: `Order is placed and in processing, hang tight we will deliver it soon !
                                                \n Your Order id is: ${orderId}`,
                                        },
                                        token: user.data.fcmToken,
                                      });
                                }
                                res.send({status: 1, message:'Orders placed successfully', data: orderId})
                            })
                        },
                        () => {
                            res.send({status: 0, message:'Error while placing order', data: null})
                        }
                    )
                });
        })
    } catch (error) {
        console.log("error", error);
        errorCallback(error)
        // res.send({status: 0, message:'Error while updating inventory', data: null})
    }
    
}

const upadateInventoryWithNewStock = async(updatedStock, id, successCallback, errorCallback) => {
    const condition = {
        "packages.packageTypeId": ObjectId(id)
    };
  
    const update = {
        $set: {
            'packages.$.qauntity': updatedStock, // Use $ to identify the matched array element
        },
    };
    const updatedInventory = await inventory.findOneAndUpdate(condition, update, { new: true });
    if (updatedInventory) {
        successCallback();
      } else {
        errorCallback();
    }
}

const getInventoryStock = async(id, packageId, callback) => {
    inventory.find({productId: id},async (err, result)=>{
        if(err)throw err
        // res.send({status: 1, message:'Orders Created', data: result});
        let currentQuantity = 0;

        await result[0].packages.map(item => {
            if(item.packageTypeId.equals(packageId)){
                currentQuantity = item.qauntity
            }
        });
        callback(currentQuantity);
    });
}

const updateInvetoryLog = (orderId, callback, type='Sell') => {
    function getCurrentDateTime() {
        const now = new Date();
      
        // Get date components
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(2); // Get the last two digits of the year
      
        // Get time components
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
      
        // Concatenate date and time in the desired format
        const dateTimeString = `${day}-${month}-${year} ${hours}:${minutes}`;
      
        return dateTimeString;
    };
    let payload = {
        orderId,
        dateTime: getCurrentDateTime(),
        orderType: type
    }
    try {
        inventoryLog.create({...payload});
        callback();
    } catch (error) {
        throw error
    }

}

exports.verifyPaymentHook = async(req, res, next) => {
// {
//   data: {
//     order: {
//       order_id: '17b7001f-3ec2-4036-b5ad-cd7902ba2089',
//       order_amount: 1400,
//       order_currency: 'INR',
//       order_tags: null
//     },
//     payment: {
//       cf_payment_id: 14916365156,
//       payment_status: 'SUCCESS',
//       payment_amount: 1400,
//       payment_currency: 'INR',
//       payment_message: 'Simulated response message',
//       payment_time: '2024-03-06T12:08:33+05:30',
//       bank_reference: '1234567890',
//       auth_id: null,
//       payment_method: [Object],
//       payment_group: 'upi'
//     },
//     customer_details: {
//       customer_name: 'Piyush Sharma',
//       customer_id: '65bc8f2fdd61641ba0add4ae',
//       customer_email: null,
//       customer_phone: '9680362283'
//     },
//     payment_gateway_details: {
//       gateway_name: null,
//       gateway_order_id: null,
//       gateway_payment_id: null,
//       gateway_status_code: null,
//       gateway_settlement: 'CASHFREE'
//     },
//     payment_offers: null
//   },
//   event_time: '2024-03-06T12:08:49+05:30',
//   type: 'PAYMENT_SUCCESS_WEBHOOK'
// }
    if(req.body.data.payment.payment_status === 'SUCCESS'){
        const condition = {
            'orderId': req.body.data.order.order_id,
        };
        const update = {
            $set: {
                'isPaid': true,
                'paymentDetails': {...req.body.data.payment},
                'orderStatus': 'In Process'
            },
        };
        await ordersSchema.findOneAndUpdate(condition, update, { new: true });
    }else{
        const condition = {
            'orderId': req.body.data.order.order_id,
        };
        const update = {
            $set: {
                'isPaid': false,
                'paymentDetails': {...req.body.data.payment},
                'orderStatus': 'Unknown'
            },
        };
        await ordersSchema.findOneAndUpdate(condition, update, { new: true });
    }
}

exports.updateOrderStatus = async(req, res, next) => {
    try {
        console.log(req.body);
        const status = req.body.status;
        const id = req.body.id;
        if(id && status){
            const order = await ordersSchema.findOne({orderId: id});
            if (order) {
                if(order.orderStatus === 'Cancelled'){
                    return res.send({status: 0, message:'Order Status can not be changed, as it is alredy in cancelled', data: null})
                };
                order.orderStatus = status;
                order.updatedAt = new Date();
                await order.save();

                const user = await userSchema.findOne({_id: response.userId});
                if(user.data.fcmToken){
                    await adminInstance.messaging().send({
                        data: {
                            title: `Order Status Changed !`,
                            body: `Order is: ${status}`,
                        },
                        token: user.data.fcmToken,
                    });
                    return res.send({status: 1, message:'Orders updated successfully', data: response})
                }else{
                    return res.send({status: 1, message:'Orders updated successfully', data: response})
                }
            } else {
                return res.send({status: 0, message:'Order not found', data: null})
            }
        }else{
            return res.send({status: 0, message:'Please send all the required fields', data: null})
        }
    } catch (error) {
        return res.send({status: 0, message: `Error while updating order -${error}` , data: null})
    }
}

function verify(ts, rawBody){
    const body = ts + rawBody
    const secretKey = process.env.XClientSecret;
    let genSignature = crypto.createHmac('sha256',secretKey).update(body).digest("base64");
    return genSignature
}

exports.cancelOrder = async(req, res, next) => {
    try {
        const orderId = req.body.orderId;
        if(orderId){
            const order = await ordersSchema.findById(orderId);
            if(!order){
                return res.send({status: 0, message:'Order not found', data: null})
            }
            if (order.orderStatus === 'In Transit' || order.orderStatus === 'Delivered') {
                return res.send({status: 0, message:'Order cannot be canceled, as it is alredy in Transit or Delivered', data: null})
            }
            if(order.orderStatus === 'Cancelled'){
                return res.send({status: 0, message:'Order cannot be canceled, as it is alredy in cancel state', data: null})
            };

            order.orderStatus = 'Cancelled';
            order.updatedAt = new Date();
            await order.save();

            for (const product of order.products) {
                // const inventoryRecord = await inventory.findOne({ productId: product._id });
                const updateResult = await inventory.findOneAndUpdate(
                    { productId: ObjectId(product._id), "packages.packageTypeId": ObjectId(product.packageType.packageTypeId) },
                    { 
                        $inc: { "packages.$.quantity": product.quantity },
                        $set: { updatedAt: new Date() }
                    },
                    { new: true }
                );
            }
            updateInvetoryLog(orderId, () => {}, 'Return')
            return res.send({status: 1, message:'Order canceled successfully', data: order})
        }else{
           return res.send({status: 0, message:'Please send all the required fields', data: null})
        }
    } catch (error) {
        return res.send({status: 0, message: `Error while updating order -${error.message}` , data: null})
    }
}

exports.calculateDeliveryCharges = async(req, res, next) => {
    const {warehouseLat, warehouseLong, OfficeLat, OfficeLong, chargesPerKilometerFromWarehouse, chargesPerKilometerFromOffice} = process.env;
    try {
        function calculateDistance(lat1, lon1, lat2, lon2) {
            const R = 6371; // Radius of the Earth in kilometers
            const dLat = degreesToRadians(lat2 - lat1);
            const dLon = degreesToRadians(lon2 - lon1);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c; // Distance in kilometers
            return distance;
        }
        // Helper function to convert degrees to radians
        function degreesToRadians(degrees) {
            return degrees * (Math.PI / 180);
        }

        const {lat, long} = req.body;

        if(!lat || !long){
            return res.send({status: 0, message: `Latitude and Longitude are required to calculate delivery charges`, data: null})
        }

        const distance1 = calculateDistance(lat, long, warehouseLat, warehouseLong);
        const distance2 = calculateDistance(lat, long, OfficeLat, OfficeLong);
        let distance = 0;
        const isCloseToWarehouse = distance1 < distance2;
        if(isCloseToWarehouse){
            distance = calculateDistance(warehouseLat, warehouseLong, lat, long);
        }else{
            distance = calculateDistance(OfficeLat, OfficeLong, lat, long);
        }
        const deliveryCharges = distance * (isCloseToWarehouse ? chargesPerKilometerFromWarehouse : chargesPerKilometerFromOffice);

        return res.send({status: 1, message: ``, data: Number(Math.ceil(deliveryCharges).toFixed(0))})
    } catch (error) {
        return res.send({status: 0, message: `Soemthing went wrong - ${error.message}`, data: null})
    }
}

