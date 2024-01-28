var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose')
var url = "mongodb://sharmaofficial12:15Eaics7406@ecommerce.yp9eu3n.mongodb.net/";

// mongoose.connect(url, (err, db)=>{
//     console.log("connected");
// });
const instance = mongoose.connection
// MongoClient.connect(url,(err, db) =>  {
//     if (err) throw err;
//     console.log("Database created!");
//     var dbInstance = db.db('TI');
//     dbInstance.collection('user').findOne({}, (err, result) => {
//         console.log("user", result);
//     });
// })



module.exports = instance;