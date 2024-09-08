const { v4: uuidv4 } = require('uuid');
var serviceAccount = require("./serviceAccountKey.json");
const nodemailer = require('nodemailer');
var admin = require("firebase-admin");

function getUniqueId(){
    return uuidv4();
}

const adminInstance = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.databaseURL,
    storageBucket: process.env.BUCKET_URL
});

const fs = require('fs');
const path = require('path');

/**
 * Convert a Base64 string to a file and save it to the filesystem.
 *
 * @param {string} base64String - The Base64 string (with or without the prefix).
 * @param {string} fileName - The desired name for the output file.
 *  * @returns {File} - The resulting File object.
 */
function base64ToFile(base64String, fileName) {
   // Remove Data URI prefix if present
  const regex = /^data:(.*);base64,(.*)$/;
  const matches = base64String.match(regex);

  let base64Data = '';
  let mimeType = '';

  if (matches) {
    mimeType = matches[1];
    base64Data = matches[2];
  } else {
    base64Data = base64String; // Handle case where there is no prefix
  }

  // Convert Base64 string to Buffer
  const buffer = Buffer.from(base64Data, 'base64');

  // Return a File-like object
  return {
    name: fileName,
    type: mimeType,
    size: buffer.length,
    buffer: buffer,
    arrayBuffer: async () => buffer.buffer,
    stream: () => buffer,
    text: async () => buffer.toString(),
    slice: (start, end) => buffer.slice(start, end),
  };
}

function sendOrderEmail(email, orderId){
  const transporter = nodemailer.createTransport({
      host: "gmail.com",
      service: "gmail",
      port: 465,
      secure: true,
      auth: {
          user: `sharma.official12@gmail.com`,
          pass: `avufxgfcowygqxpx`,
      },
  });

  const mailOptions = {
    from: process.env.gmailUser,
    to: email,
    subject: 'Order Placed Successfully !',
    text: `Order is placed and in processing, hang tight we will deliver it soon !
    \n Your Order id is: ${orderId}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};
  
module.exports = {adminInstance, getUniqueId, base64ToFile, sendOrderEmail};
