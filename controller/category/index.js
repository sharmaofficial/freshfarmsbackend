const { Query, ID } = require("node-appwrite");
const { databases } = require("../../database");
const categoriySchema = require("../../modal/categories")
const { adminInstance, getUniqueId, uploadFileToBucket } = require("../../utils");
const { string } = require("joi");

let bucket = adminInstance.storage().bucket();

exports.getCategories = async(req, res, next) => {
    try {
        const categories = await databases.listDocuments(
            process.env.dbId,
            process.env.categoriesCollectID,
            [
                Query.equal('isActive', [true])
            ]
        );
        if(categories.total){
            return res.send({status: 1, message: `category fetched successfully`, data: categories})
        }else{
            return res.send({status: 0, message: `No categories found`, data: []})
        }
    } catch (error) {
        return res.send({status: 0, message: `something went wrong !! - ${error.message}`, data: null})
    }
};

exports.getCategoriesForAdmin = async(req, res, next) => {
    try {
        const categories = await databases.listDocuments(
            process.env.dbId,
            process.env.categoriesCollectID,
        );
        if(categories.total){
            return res.send({status: 1, message: `category fetched successfully`, data: categories})
        }else{
            return res.send({status: 0, message: `No categories found`, data: []})
        }
    } catch (error) {
        return res.send({status: 0, message: `something went wrong !! - ${error.message}`, data: null})
    }
};

exports.addCategory = async(req, res, next) => {
    let payload = {
        name: req.body.name,
        isActive: false,
        image: ""
    }
    try {
        const fileURL = await uploadFileToBucket(req.file);
        payload.image = fileURL;
        const response = await databases.createDocument(
            process.env.dbId,
            process.env.categoriesCollectID,
            ID.unique(),
            payload
        );
        return res.send({status: 1, message: "Category Created Successfully !!", data: response.$id});
    } catch (error) {
        return res.send({status: 0, message: error, data: null})
    }
}

exports.editCategory = async(req, res, next) => {
    try {
        const {id, name, isActive} = req.body;
        let payload = {};
        if(!id){
            return res.send({status: 0, message: 'Please send category id which needs to be edit', data: null});
        } 
        if(name || name instanceof String){
            payload.name = name;
        }
        if(isActive instanceof Boolean){
            payload.isActive = isActive;
        }
        if(req.file){
           const fileURL = await uploadFileToBucket(req.file);
           payload.Image = fileURL;
        }
        const response = await databases.updateDocument(
            process.env.dbId,
            process.env.categoriesCollectID,
            id,
            payload
        );
        return res.send({status: 1, message: 'Edit Successfull', data: response.$id});
    } catch (error) {
        return res.send({status: 0, message: error, data: null});
    }
    // if(req.body.coverImage){
    //     let data = {...req.body};
    //     delete data._id;
    //     try {
    //         uploadImageToFirebaseAndReturnURL(
    //             req,
    //             async(url) => {
    //                 const update = {
    //                     $set: {
    //                         ...data,
    //                         coverImage: url
    //                     },
    //                 };
    //                 const options = {
    //                     new: true,
    //                 };
    //                 const response = await categoriySchema.findOneAndUpdate({_id: req.body._id}, update, options);
    //                 if(response){
    //                     res.send({status: 1, message: "Category Updated Successfully !!", data: response});
    //                 }else{
    //                     res.send({status: 0, message: "Category Updated Failed !!", data: null});
    //                 }
    //             },
    //             (error) => {
    //                 res.send({status: 0, message: error, data: null})
    //             }
    //         )
    //     } catch (error) {
    //         res.send({status: 0, message: error, data: null})
    //     }
    // }else{
    //     try {
    //         let data = {...req.body};
    //         delete data._id;
    //         delete data.coverImage;
    
    //         const update = {
    //             $set: {
    //                 ...data,
    //             },
    //         };
    //         const options = {
    //             new: true,
    //         };
    //         const response = await categoriySchema.findOneAndUpdate({_id: req.body._id}, update, options);
    //         if(response){
    //             res.send({status: 1, message: `Category ${response.name} Updated Successfully !!`, data: response});
    //         }else{
    //             res.send({status: 0, message: "Category not found !!", data: null});
    //         } 
    //     } catch (error) {   
    //         console.log(error);
    //         res.send({status: 0, message: `Product Updated Failed !! - ${error.message}`, data: null});         
    //     }
    // }
}

exports.deleteCategory = async(req, res, next) => {
    try {
        console.log("req.body", req);
        const {id} = req.body;
        if(!id){
            return res.send({status: 0, message: 'Please send category id which needs to be delete', data: null});
        }
        const response = await databases.deleteDocument(
            process.env.dbId,
            process.env.categoriesCollectID,
            id,
        );
        return res.send({status: 1, message: 'Delete Successfull', data: response.$id});
    } catch (error) {
        return res.send({status: 0, message: error, data: null});
    }
}

function uploadImageToFirebaseAndReturnURL(req, successCallback, errorCallback){
    try {
        const buffer = Buffer.from(req.body.coverImage, 'base64');
        const fileName = `${req.body.name}_${req.userId}${getUniqueId()}` + getExtensionFromMimeType(req.body.image.type);
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