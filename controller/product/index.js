var mongoose = require('mongoose');
const productSchema = require("../../modal/product");
const { adminInstance, getUniqueId } = require("../../utils");
const { databases } = require('../../database');
const { Query, ID } = require('node-appwrite');

let bucket = adminInstance.storage().bucket();

exports.getProducts = async(req, res, next) => {
    try {
        const {categoryId} = req.body;
        if(!categoryId){
            res.send({status: 0, message:'Please send category id in api body', data: []})
        }else{
            const products = await databases.listDocuments(
                process.env.dbId,
                process.env.productsCollectID,
                [
                    Query.equal('category', [categoryId]),
                    Query.equal('isActive', [true])
                ]
            );
            if(products.total){
                return res.send({status: 1, message: `products fetched`, data: products});
            }else{
                return res.send({status: 0, message: `No products found`, data: []});
            }
        }
    } catch (error) {
        return res.send({status: 0, message: `something went wrong !! - ${error.message}`, data: null})
    }
}

exports.getAllProductsForAdmin = async(req, res, next) => {
    try {
        // const {categoryId} = req.body;
        // if(!categoryId){
        //     res.send({status: 0, message:'Please send category id in api body', data: []})
        // }else{
            const response = {
                categories:[],
                products: []
            };
            const categories = await databases.listDocuments(
                process.env.dbId,
                process.env.categoriesCollectID,
            );
            if(!categories.total){
                return res.send({status: 0, message: `No categories found`, data: response});
            }
            const products = await databases.listDocuments(
                process.env.dbId,
                process.env.productsCollectID,
            );
            if(products.total){
                response.categories.push(...categories.documents);
                response.products.push(...products.documents);
                console.log("response", response);
                return res.send({status: 1, message: `products fetched`, data: response});
            }else{
                return res.send({status: 0, message: `No products found`, data: response});
            }
        // }
    } catch (error) {
        return res.send({status: 0, message: `something went wrong !! - ${error.message}`, data: null})
    }
}

exports.getProduct = async(req, res, next) => {
    if(!req.body.id){
        res.send({status: 0, message:'Please send product id in api body', data: null})
    }else{
        const data = await databases.listDocuments(
            process.env.dbId,
            process.env.productsCollectID,
            [
                Query.equal('$id', [req.body.id])
            ]
        );
        if(data.total){
            const inventoryData = await databases.listDocuments(
                process.env.dbId,
                process.env.inventoryCollectID,
                [
                    Query.equal('productId', [data.documents[0].$id]),
                    Query.greaterThan('quantity', [2]),
                ]
            );
            let payload = {
                inventory: inventoryData.documents,
                productDetails: data.documents[0]
            }
            res.send({status: 1, message: "Success", data: payload})
        }else{
            res.send({status: 0, message: "Product details not found", data: null})
        }
        // res.send({status: 1, message: "Success", data: []})
        // let query = {_id: req.body.id}
        // let inventoryData = [];
        // let packageTypeData = [];
        // try {
        //     inventoryData = await inventorySchema.findOne({productId: req.body.id});
        //     packageTypeData = await packageTypeSchema.find({});
        //     const result = await productSchema.findOne({_id: req.body.id});
        //     if(result){
        //         let mergedInventoryItems = [];
        //         let nonNullValues = [] ;
        //         if(inventoryData){
        //             mergedInventoryItems = inventoryData.packages.map(item => {
        //                 if(item.qauntity > 1 && item.isActive){
        //                     let packageType = packageTypeData.find(item1 => {
        //                         return item1._id.equals(item.packageTypeId);
        //                     });
        //                     if (packageType) {
        //                         return {
        //                             ...item,
        //                             packageType: {
        //                                 ...item,
        //                                 name: packageType.name,
        //                                 id: packageType.id,
        //                                 price: result.price * packageType.name,
        //                             }
        //                         };
        //                     }
        //                 }else{
        //                     return {}
        //                 }
        //             });
        //         }
        //         if(mergedInventoryItems.length){
        //             nonNullValues = mergedInventoryItems.filter(item => {
        //                 if(Object.entries(item).length){
        //                     return true
        //                 }
        //                 return false
        //             });  
        //         }
        //         let response = {productDetails: result, inventoryDetails: nonNullValues};
        //         res.send({status: 1, message:'Product Details fetched', data: response})
        //     }else{
        //         res.send({status: 1, message: "Product not found", data: null})
        //     }
        // } catch (error) {
        //     res.send({status: 0, message: error.message, data: null})
        // }
        // productSchema.findOne({...query},(error, result) => {
        //     if(error) throw err
            
        // })
    }
}

exports.addProduct = async(req, res, next) => {
    let payload = {
        associated_shop: req.body.shopName,
        name: req.body.name,
        description: req.body.description,
        estimated_delivery: req.body.estimated_delivery,
        isActive: false,
        price: parseFloat(req.body.price),
        category: req.body.categoryId,
        image: ""
    }
    try {
        uploadImageToFirebaseAndReturnURL(
            req,
            async(url) => {
                payload.image = url;
                // const response = await productSchema.create({...payload});
                const response  = databases.createDocument(
                    process.env.dbId,
                    process.env.productsCollectID,
                    ID.unique(),
                    payload,
                )
                return res.send({status: 1, message: "Product Created Successfully !!", data: response})
            },
            (error) => {
                return res.send({status: 0, message: error, data: null})
            }
        )
    } catch (error) {
        return res.send({status: 0, message: error, data: null})
    }
}

exports.editProduct = async(req, res, next) => {
    if(req.body.coverImage){
        let data = {...req.body, categoryId: mongoose.Types.ObjectId(req.body.categoryId)};
        delete data._id;
        try {
            uploadImageToFirebaseAndReturnURL(
                req,
                async(url) => {
                    const update = {
                        $set: {
                            ...data,
                            coverImage: url
                        },
                    };
                    const options = {
                        new: true,
                    };
                    const response = await productSchema.findOneAndUpdate({_id: req.body._id}, update, options);
                    if(response){
                        res.send({status: 1, message: "Product Updated Successfully !!", data: response});
                    }else{
                        res.send({status: 0, message: "Product not found !!", data: null});
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
        try {
            let data = {...req.body, categoryId: mongoose.Types.ObjectId(req.body.categoryId)};
            delete data._id;
            delete data.coverImage;
    
            const update = {
                $set: {
                    ...data,
                },
            };
    
            const options = {
                new: true,
            };
            const response = await productSchema.findOneAndUpdate({_id: req.body._id}, update, options);
            if(response){
                res.send({status: 1, message: `Product ${response.name} Updated Successfully !!`, data: response});
            }else{
                res.send({status: 0, message: "Product not found !!", data: null});
            }
        } catch (error) {   
            console.log(error);
            res.send({status: 0, message: `Product Updated Failed !! - ${error.message}`, data: null});         
        }
    }
}

exports.deleteProduct = async(req, res, next) => {
    try {
        const {id} = req.body;
        if(id){            
            const response = await databases.deleteDocument(
                process.env.dbId,
                process.env.productsCollectID,
                id
            )
            return res.send({status: 1, message: "Product deleted successfully !!", data: response});
        } else {
            return res.send({status: 0, message: "Please send product Id !!", data: null});
        }
    } catch (error) {
       return res.send({status: 0, message: "Product not found !!", data: null});
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