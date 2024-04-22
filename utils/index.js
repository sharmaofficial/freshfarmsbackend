const { v4: uuidv4 } = require('uuid');

var serviceAccount = require("./serviceAccountKey.json");
var admin = require("firebase-admin");

function getUniqueId(){
    return uuidv4();
}

const adminInstance = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.databaseURL,
    storageBucket: process.env.BUCKET_URL
});
  
module.exports = {adminInstance, getUniqueId};
