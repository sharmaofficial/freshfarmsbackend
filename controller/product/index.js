const inventorySchema = require("../../modal/inventory")
const packageTypeSchema = require("../../modal/packageType")
const productSchema = require("../../modal/product");
const { adminInstance, getUniqueId } = require("../../utils");

let bucket = adminInstance.storage().bucket();

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
        res.send({status: 0, message:'Please send product id in api body', data: null})
    }else{
        let query = {id: req.body.id}
        let inventoryData = [];
        let packageTypeData = [];
        try {
            inventoryData = await inventorySchema.find({productId: req.body.id});
            packageTypeData = await packageTypeSchema.find({});
            const result = await productSchema.findOne({...query});
            if(result){
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
                                        price: result.price * packageType.name,
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
                let response = {productDetails: result, inventoryDetails: nonNullValues};
                res.send({status: 1, message:'Product Details fetched', data: response})
            }else{
                res.send({status: 1, message: "Product not found", data: null})
            }
        } catch (error) {
            res.send({status: 0, message: error.message, data: null})
        }


        productSchema.findOne({...query},(error, result) => {
            if(error) throw err
            
        })
    }
}

exports.addProduct = async(req, res, next) => {
    let payload = {
        name: req.body.name,
        categoryId: req.body.categoryId,
        description: req.body.description,
        estimated_delivery: req.body.estimated_delivery,
        isActive: req.body.isActive,
        coverImage: ""
    }
    try {
        uploadImageToFirebaseAndReturnURL(
            req,
            async(url) => {
                payload.coverImage = url;
                const response = await productSchema.create({...payload});
                res.send({status: 1, message: "Product Created Successfully !!", data: response})
            },
            (error) => {
                res.send({status: 0, message: error, data: null})
            }
        )
    } catch (error) {
        res.send({status: 0, message: error, data: null})
    }
}

exports.editProduct = async(req, res, next) => {
    if(req.body.coverImage){
        try {
            uploadImageToFirebaseAndReturnURL(
                req,
                async(url) => {
                    const update = {
                        $set: {
                            ...req.body.data,
                            profilePicture: url
                        },
                    };
                    const options = {
                        new: true,
                    };
                    payload.coverImage = url;
                    const response = await productSchema.findOneAndUpdate({_id: req.body.id}, update, options);
                    if(response){
                        res.send({status: 1, message: "Product Updated Successfully !!", data: response});
                    }else{
                        res.send({status: 0, message: "Product Updated Failed !!", data: null});
                    }
                },
                (error) => {
                    res.send({status: 0, message: error, data: null})
                }
            )
        } catch (error) {
            res.send({status: 0, message: error, data: null})
        }
    }else{
        const update = {
            $set: {
                ...req.body,
            },
        };
        const options = {
            new: true,
        };
        const response = await productSchema.findOneAndUpdate({_id: req.body.id}, update, options);
        if(response){
            res.send({status: 1, message: "Product Updated Successfully !!", data: response});
        }else{
            res.send({status: 0, message: "Product Updated Failed !!", data: null});
        }
    }
}

function uploadImageToFirebaseAndReturnURL(req, successCallback, errorCallback){
    try {
        const buffer = Buffer.from(req.body.coverImage, 'base64');
        const fileName = `${req.body.name}_${req.userId}${getUniqueId()}` + getExtensionFromMimeType(req.body.image.type);
        console.log("fileName", fileName);
        console.log("buffer", buffer);
        const file = bucket.file(fileName);
        file.createWriteStream().end(buffer)
        file.getSignedUrl({ action: 'read', expires: '03-09-2055' })
        .then((url) => {
            console.log('Image URL:', url);
            successCallback(url[0]);
        })
        .catch((error) => {
            console.error('Error getting signed URL:', error);
        });
    } catch (error) {
        console.log("error", error);
        errorCallback(error);
    }

    function getExtensionFromMimeType(mimeType) {
        const mimeMap = {
          'image/jpeg': '.jpg',
          'image/png': '.png',
          'image/gif': '.gif',
        };
      
        // Convert to lowercase to handle case-insensitivity
        const lowerCaseMimeType = mimeType.toLowerCase();
      
        // Check if the mimeType is in the map
        if (mimeMap.hasOwnProperty(lowerCaseMimeType)) {
          return mimeMap[lowerCaseMimeType];
        }
      
        // If the mimeType is not found in the map, you may handle it accordingly (return a default extension or null)
        return '.jpg';
    }
}