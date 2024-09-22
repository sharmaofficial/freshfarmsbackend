const { databases } = require('../../database');

exports.getInventoryLog = async(req, res, next) => {
    try {
        const response = await databases.listDocuments(
            process.env.dbId,
            process.env.inventoryLogCollectID,
        );
        if(response.total){
            return res.send({status: 1, message: `category fetched successfully`, data: response})
        }else{
            return res.send({status: 0, message: `No categories found`, data: []})
        }
    } catch (error) {
        res.send({status: 0, messsage: `Error while fetching Invetory log - ${error}`, data: null});
    }
}