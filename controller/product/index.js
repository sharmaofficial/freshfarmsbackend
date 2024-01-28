const inventorySchema = require("../../modal/inventory")
const packageTypeSchema = require("../../modal/packageType")
const productSchema = require("../../modal/product")

exports.getProducts = (req, res, next) => {
    if(!req.body.categoryId){
        res.send({status: 0, message:'Please send category id in api body', data: []})
    }else{
        productSchema.find({...req.body},(error, result) => {
            if(error) throw err
            res.send({status: 1, message:'Product list fetched', data: result})
        })
    }
}

exports.getProduct = async(req, res, next) => {
    if(!req.body.id){
        res.send({status: 0, message:'Please send product id in api body', data: []})
    }else{
        let query = {id: req.body.id}
        let inventoryData = [];
        let mergedInventoryItems = [];
        let packageTypeData = [];
        try {
            inventoryData = await inventorySchema.find({productId: req.body.id});
            packageTypeData = await packageTypeSchema.find({});
        } catch (error) {
            throw error
        }
        productSchema.find({...query},(error, result) => {
            if(error) throw err
            let mergedInventoryItems = [];
            if(inventoryData.length){
                mergedInventoryItems = inventoryData[0].packages.map(item => {
                    if(item.qauntity > 1){
                        let packageType = packageTypeData.find(item1 => {
                            return item1.id === item.packageTypeId;
                        });
                        if (packageType) {
                            return {
                                ...item,
                                packageType: {
                                    ...item,
                                    name: packageType.name,
                                    id: packageType.id,
                                    price: result[0].price * packageType.name,
                                }
                            };
                        }
                    }else{
                        return {}
                    }
                });
            }
            let nonNullValues = mergedInventoryItems.filter(item => {
                if(Object.entries(item).length){
                    return true
                }
                return false
            });
            
            let response = {productDetails: result[0], inventoryDetails: nonNullValues};
            res.send({status: 1, message:'Product Details fetched', data: response})
        })
    }
}