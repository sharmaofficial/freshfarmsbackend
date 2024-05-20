const inventory = require("../../modal/inventory");
const packageTypeSchema = require("../../modal/packageType");
const { getUniqueId } = require("../../utils");

exports.getPackages = async(req, res, next) => {
    try {
        const response = await packageTypeSchema.find({isActive: true});
        if(response){
            res.send({status: 1, message: 'Packages fetched', data: response});
        }else{
            res.send({status: 1, message: 'Packages not found', data: null});
        }
    } catch (error) {
        res.send({status: 0, message: `Error while fetching packages - ${error}`, data: null});
    }
}

exports.getPackageByProductId = async(req, res, next) => {
    try {
        const productId = req.body.productId;
        console.log("productId", productId);
        if(productId){
            const response = await packageTypeSchema.find({isActive: true});
            const inventoryResponse = await inventory.find({productId: productId});
            const payload = {
                allPackages: response,
                filterePackages: inventoryResponse
            }
            if(response){
                res.send({status: 1, message: 'Packages fetched', data: payload});
            }else{
                res.send({status: 0, message: 'Packages not found', data: null});
            }
        }else{
            res.send({status: 0, message: 'Please send product ID', data: null});
        }
    } catch (error) {
        res.send({status: 0, message: `Error while fetching packages - ${error}`, data: null});
    }
}

exports.addPackage = async(req, res, next) => {
    try {
        if(req.body.name){
            let payload = {
                name: req.body.name,
                isActive: false
            }
            const response = await packageTypeSchema.create({...payload});
            if(response){
                res.send({status: 1, message: 'Package created successfully !', data: response});
            }else{
                res.send({status: 1, message: 'Package creation failed !', data: null});
            }
        }else{
            res.send({status: 1, message: 'Please send required fields !', data: null});
        }

    } catch (error) {
        res.send({status: 0, message: `Package creation failed ! - ${error}`, data: null});
    }
}

exports.editPackage = async(req, res, next) => {
    const id = req.body.id;
    const payload = {
        ...req.body
    };
    delete payload.id;
    try {
        if(id){
            const condition = {
                _id: id
            };
            const update = {
                $set: {
                    ...payload,
                },
            };

            const response = await packageTypeSchema.findOneAndUpdate(condition, update, {new: true});
            if(response){
                res.send({status: 1, message: 'Package updated successfully !', data: response});
            }else{
                res.send({status: 1, message: 'Package updation failed !', data: null});
            }
        }else{
            res.send({status: 1, message: 'Please send package id', data: null});
        }
    } catch (error) {
        res.send({status: 0, message: `Package updation failed ! - ${error}`, data: null});
    }
}