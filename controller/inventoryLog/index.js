const inventoryLogSchema = require('../../modal/inventoryLog');

exports.getInventoryLog = async(req, res, next) => {
    try {
        const response = await inventoryLogSchema.find({});
        if(response){
            res.send({status: 1, messsage: `Invetory log fetched`, data: response});
        }else{
            res.send({status: 0, messsage: `No invetory log found`, data: null});
        }
    } catch (error) {
        res.send({status: 0, messsage: `Error while fetching Invetory log - ${error}`, data: null});
    }
}