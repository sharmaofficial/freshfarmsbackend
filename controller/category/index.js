const categoriySchema = require("../../modal/categories")
const { adminInstance, getUniqueId } = require("../../utils");

let bucket = adminInstance.storage().bucket();

exports.getCategories = (req, res, next) => {
    categoriySchema.find({ isActive: true }, (err, result) => {
        if (err) throw err
        res.send({ status: 1, message: 'Categories list fetched', data: result })
    })
};

exports.getCategoriesForAdmin = (req, res, next) => {
    categoriySchema.find({}, (err, result) => {
        if (err) throw err
        res.send({ status: 1, message: 'Categories list fetched', data: result })
    })
};

exports.addCategory = async(req, res, next) => {
    let payload = {
        name: req.body.name,
        isActive: false,
        coverImage: ""
    }
    try {
        uploadImageToFirebaseAndReturnURL(
            req,
            async(url) => {
                payload.coverImage = url;
                const response = await categoriySchema.create({...payload});
                res.send({status: 1, message: "Category Created Successfully !!", data: response})
            },
            (error) => {
                res.send({status: 0, message: error, data: null})
            }
        )
    } catch (error) {
        res.send({status: 0, message: error, data: null})
    }
}

exports.editCategory = async(req, res, next) => {
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
                    const response = await categoriySchema.findOneAndUpdate({_id: req.body.id}, update, options);
                    if(response){
                        res.send({status: 1, message: "Category Updated Successfully !!", data: response});
                    }else{
                        res.send({status: 0, message: "Category Updated Failed !!", data: null});
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
        const response = await categoriySchema.findOneAndUpdate({_id: req.body._id}, update, options);
        if(response){
            res.send({status: 1, message: `Category ${response.name} Updated Successfully !!`, data: response});
        }else{
            res.send({status: 0, message: "Category not found !!", data: null});
        }
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