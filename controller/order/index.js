const inventory = require("../../modal/inventory")
const inventoryLog = require("../../modal/inventoryLog")
const ordersSchema = require("../../modal/order");
const userSchema = require("../../modal/user");
const { getUniqueId,adminInstance } = require("../../utils");
const crypto = require('crypto');

const { Cashfree } = require("cashfree-pg");

Cashfree.XClientId = process.env.XClientId;
Cashfree.XClientSecret = process.env.XClientSecret;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

exports.getOrders = (req, res, next) => {
    ordersSchema.find({},(err, result)=> {
        if(err)throw err
        res.send({status: 1, message:'Orders list fetched', data: result})
    })
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
        const response = await ordersSchema.findOne({orderId: req.body.orderId});
        console.log("response", response);
        if(response){
            res.send({status: 1, message:'', data: response})
        }else{
            res.send({status: 1, message:'Order not found', data: null})
        }
    } catch (error) {
        res.send({status: 0, message:error.message, data: null})
    }
}

exports.createOrder = (req, res, next) => {
    const orderId = getUniqueId();
    let payload = {
        ...req.body,
        orderId: orderId,
        paymentDetails: {},
        isPaid: false,
        orderStatus: 'Processing'
    }
    ordersSchema.create({...payload},(err, result)=>{
        if(err)throw err
        // res.send({status: 1, message:'Orders Created', data: result});
        createCFOrderId(
            {
                order_id: orderId,
                order_amount: req.body.totalAmout,
                order_currency: "INR",
                customer_details: {
                    customer_id: req.userId,
                    customer_phone: req.body?.address?.phoneNumber || "",
                    customer_name: req.body?.address?.name || ""
                }
            },
            (response) => {
                res.send({status: 1, message:'Orders Created', data: response});
            },
            async () => {
                const condition = {
                    'orderId': orderId, // Match the package with a specific id
                };
              
                const update = {
                    $set: {
                        'orderStatus': "Terminated due to payment failure", // Use $ to identify the matched array element
                    },
                };
                await ordersSchema.findOneAndUpdate(condition, update, {new: true})
                res.send({status: 0, message:'Error while placing order', data: null});
            })
        // updateInventory(payload.orderId)
    });

    const createCFOrderId = (request, successCallback, errorCallback) => {
        // let request = {
        //     order_amount: 1,
        //     order_currency: "INR",
        //     order_id: orderId,
        //     customer_details: {
        //         customer_id: "walterwNrcMi",
        //         customer_phone: "9999999999"
        //     },
        //     order_meta: {
        //         return_url: `https://www.cashfree.com/devstudio/preview/pg/web/checkout?order_id=${orderId}`
        //     }
        // };
        // console.log("request", request);
        Cashfree.PGCreateOrder("2022-09-01", request).then((response) => {
            // console.log('Order Created successfully:',response.data)
            successCallback(response.data);
        }).catch((error) => {
            console.error('Error:', error);
            errorCallback();
        });
    }
}

exports.verifyOrder = (req, res, next) => {
    Cashfree.PGFetchOrder("2022-09-01", req.body.orderId).then(async (response) => {
        let orderId = req.body.orderId
        if(response.data.order_status === 'PAID'){
            const condition = {
                'orderId': orderId,
            };
            const update = {
                $set: {
                    'isPaid': true,
                    'paymentDetails': {...response.data},
                    'orderStatus': response.data.order_status
                },
            };
            await ordersSchema.findOneAndUpdate(condition, update, { new: true });
            updateInventory(orderId, res, req, (error) => {
                res.send({status: 0, message:'Error while updating inventory', data: null, error: error})
            });
        }else{
            const condition = {
                'orderId': orderId,
            };
            const update = {
                $set: {
                    'isPaid': false,
                    'orderStatus': response.data.order_status,
                    'paymentDetails': {...response.data},
                },
            };
            await ordersSchema.findOneAndUpdate(condition, update, { new: true });
            res.send({status: 1, message:'Orders payment pending', data: response.data});
        }
    }).catch((error) => {
        console.error('Error:', error);
        res.send({status: 0, message:'Error while verifying order payment', data: null});
    });
}

const updateInventory = async(orderId, res, req, errorCallback) => {
    let orderDetails;
    try {
        orderDetails = await ordersSchema.find({orderId: orderId});
        orderDetails[0].products.map(item => {
            //item.id is product id
            //item.packageType is pachakeType id
            getInventoryStock(
                item.id, 
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
        'packages.packageTypeId': id, // Match the package with a specific id
    };
  
    const update = {
        $set: {
            'packages.$.qauntity': updatedStock, // Use $ to identify the matched array element
        },
    };
    const updatedInventory = await inventory.findOneAndUpdate(condition, update, { new: true });
    console.log("updatedInventory", updatedInventory);
    if (updatedInventory) {
        console.log(' updated Inventory:', updatedInventory);
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
            if(item.packageTypeId === packageId){
                currentQuantity = item.qauntity
            }
        });
        callback(currentQuantity);
    });
}

const updateInvetoryLog = (orderId, callback) => {
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
        orderType: 'Sell'
    }
    try {
        inventoryLog.create({...payload});
        callback();
    } catch (error) {
        throw error
    }

}

exports.verifyPaymentHook = (req, res, next) => {
    console.log(req.rawBody);
    const ts = req.headers["x-webhook-timestamp"]
    const signature = req.headers["x-webhook-signature"]  
    const currTs = Math.floor(new Date().getTime() / 1000)
  	if(currTs - ts > 30000){
    	res.send("Failed")
  	}  
    const genSignature = verify(ts, req.rawBody)
    if(signature === genSignature){
        res.send('OK')
    } else {
        res.send("failed")
    } 
}

exports.updateOrderStatus = async(req, res, next) => {
    try {
        const status = req.body.status;
        const id = req.body.id;
        if(id && status){
            const condition = {
                '_id': id,
            };
            const update = {
                $set: {
                    'orderStatus': status,
                },
            };
            const response = await ordersSchema.findOneAndUpdate(condition, update, { new: true });
            if (response) {
                res.send({status: 1, message:'Orders updated successfully', data: null})
                    const user = await userSchema.findOne({_id: response.userId});
                    if(user.data.fcmToken){
                        await adminInstance.messaging().send({
                            data: {
                                title: `Order Status Changed !`,
                                body: `Order is: ${status}`,
                            },
                            token: user.data.fcmToken,
                        });
                    }
            } else {
                res.send({status: 0, message:'Error while updating order', data: null})
            }
        }else{
            res.send({status: 1, message:'Please send all the required fields', data: null})
        }
    } catch (error) {
        res.send({status: 0, message: `Error while updating order -${error}` , data: null})
    }
}

function verify(ts, rawBody){
    const body = ts + rawBody
    const secretKey = process.env.XClientSecret;
    let genSignature = crypto.createHmac('sha256',secretKey).update(body).digest("base64");
    return genSignature
}
