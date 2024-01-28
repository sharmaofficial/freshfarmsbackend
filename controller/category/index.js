const categoriySchema = require("../../modal/categories")


exports.getCategories = (req, res, next) => {
    categoriySchema.find({ isActive: true }, (err, result) => {
        if (err) throw err
        res.send({ status: 1, message: 'Categories list fetched', data: result })
    })
}