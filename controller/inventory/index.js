const { ObjectId } = require("mongodb");
const inventorySchema = require("../../modal/inventory");

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

