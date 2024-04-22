const inventorySchema = require("../../modal/inventory");

exports.getLatestQuantityFromPackage = (req, res, next) => {
    if(!req.body.productId){
        res.send({status: 0, message:'Please send product id in api body', data: []})
    }else if(!req.body.packageId){
        res.send({status: 0, message:'Please send package id in api body', data: []})
    }
    else{
        inventorySchema.find({productId: req.body.productId},(error, result) => {
            if(error) throw err
            const availableQauntity = result[0].packages.find(package => package.packageTypeId === req.body.packageId);
            res.send({status: 1, message:'Quantity fetched', data: availableQauntity.qauntity})
        })
    }
}

