const inventory = require("../../modal/inventory");
const packageTypeSchema = require("../../modal/packageType");
const { databases } = require("../../database");
const { getUniqueId } = require("../../utils");
const { ID, Query } = require("node-appwrite");

exports.getPackages = async(req, res, next) => {
    try {
        const packages = await databases.listDocuments(
            process.env.dbId,
            process.env.packageCollectID,
            [
                Query.limit(1000),
            ]
        )
        if(packages.total){
            return res.send({status: 1, message:'Packages list fetched', data: packages.documents});
        }else{
            return res.send({status: 0, message:'No packages found', data: []});
        }
    } catch (error) {
        res.send({status: 0, message: `Error while fetching packages - ${error}`, data: null});
    }
}

exports.getPackageByProductId = async(req, res, next) => {
    try {
        const productId = req.body.productId;
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
            const name = Number(req.body.name);
            console.log("name", typeof name);

            if(typeof name !== 'number' && typeof name !== NaN){
                return res.send({status: 0, message: 'Name should be a number', data: null});
            } else {                
                let payload = {
                    name: name,
                    isActive: false,
                    updateAt: new Date(),
                };
                console.log("payload", payload);
                const response = await databases.createDocument(
                    process.env.dbId,
                    process.env.packageCollectID,
                    ID.unique(),
                    payload
                )
                return res.send({status: 1, message:'Packages created successfully', data: response.$id});
            }
        }else{
            return res.send({status: 0, message: 'Please send required fields !', data: null});
        }

    } catch (error) {
       return res.send({status: 0, message: `Package creation failed ! - ${error}`, data: null});
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