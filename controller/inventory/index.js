const { ObjectId } = require("mongodb");
const inventorySchema = require("../../modal/inventory");
const inventoryLog = require("../../modal/inventoryLog");

exports.getLatestQuantityFromPackage = async(req, res, next) => {
    if(!req.body.productId){
        res.send({status: 0, message:'Please send product id in api body', data: []})
    }else if(!req.body.packageId){
        res.send({status: 0, message:'Please send package id in api body', data: []})
    }
    else{
        try {
            const response = await inventorySchema.findOne({productId: req.body.productId});
            console.log("req.body.packageId", req.body.packageId);
            console.log("response", response);
            const availableQauntity = response.packages.find(package => package.packageTypeId.equals(req.body.packageId));
            console.log("availableQauntity", availableQauntity);
            if(response){
                res.send({status: 1, message:'Quantity fetched', data: availableQauntity.qauntity});
            }else{
                res.send({status: 0, message:'Quantity Not Found', data: null});
            }

        } catch (error) {
            console.log(error);
            res.send({status: 0, message:`Error while fetching quantity - ${error}`, data: null});
        }
    }
}

exports.updateStock = async(req, res, next) => {

    try {
        const {productId, packagesData} = req.body;
        if(!productId){
            res.send({status: 0, message:'Please send product id in api body', data: []});
            return
        }
        if(!packagesData.length){
            res.send({status: 0, message:'Please send packages in api body', data: []});
            return
        }

        let updatePackages = [];
        packagesData.forEach(package => {
            updatePackages.push({
                packageTypeId: ObjectId(package._id),
                qauntity: Number(package.updateQuantity || package.currentQuantity)
            })
        });
        const update = {
            $set: { 
                'packages': updatePackages
            }
        }
        const response = await inventorySchema.findOneAndUpdate({productId: productId}, update, {new:true});
        updateInvetoryLog(null, response, () => {}, () => {});
        if(response){
            res.send({status: 1, message:'Quantity Updated', data: response});
        }else{
            res.send({status: 0, message:'Packages Not Found', data: null});
        }

    } catch (error) {
        console.log(error);
        res.send({status: 0, message:`Error while updating quantity - ${error}`, data: null});
    }
}

exports.updateProductPackageStatus = async(req, res, next) => {

    try {
        const {status, productId, packageTypeId} = req.body;
        if(!productId){
            res.send({status: 0, message:'Please send product id in api body', data: []});
            return
        }
        if(!packageTypeId){
            res.send({status: 0, message:'Please send package Id in api body', data: []});
            return
        }

        // let updatePackages = [];
        // packagesData.forEach(package => {
        //     updatePackages.push({
        //         packageTypeId: ObjectId(package._id),
        //         qauntity: Number(package.updateQuantity || package.currentQuantity)
        //     })
        // });

        // const update = {
        //     $set: { 
        //         'packages': updatePackages
        //     }
        // }
        const response = await inventorySchema.updateOne(
            { productId: productId },
            { $set: { "packages.$[elem].isActive": status ? true : false } },
            { arrayFilters: [{ "elem.packageTypeId": ObjectId(packageTypeId) }] }
        );
        // const response = await inventorySchema.findOneAndUpdate({productId: productId}, update, {new:true});
        // updateInvetoryLog(null, response, () => {}, () => {});
        if(response){
            res.send({status: 1, message:'Status Updated', data: response});
        }else{
            res.send({status: 0, message:'Packages Not Found', data: null});
        }

    } catch (error) {
        console.log(error);
        res.send({status: 0, message:`Error while updating status - ${error}`, data: null});
    }
}

const updateInvetoryLog = (orderId, updateData, successCallback, errorCallback) => {
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
        updateData,
        dateTime: getCurrentDateTime(),
        orderType: 'purchase'
    }
    try {
        inventoryLog.create({...payload});
        successCallback();
    } catch (error) {
        console.log("error", error);
        errorCallback(error.message);
    }

}

