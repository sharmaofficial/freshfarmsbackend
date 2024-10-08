var userSchema = require('../../modal/user');
const { getUniqueId, adminInstance } = require('../../utils');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const orders = require('../../modal/order');
const { ObjectId } = require('mongodb');
const { account, users, databases, appwriteSDK, messaging, storage } = require('../../database');
const { ID, Query, InputFile, ImageGravity, ImageFormat } = require('node-appwrite');
const user = require('../../modal/user');
const CryptoJS = require('crypto-js');

let bucket = adminInstance.storage().bucket();

exports.list = async(req, res, next) => {
    try {
       const response = await users.list();
       return res.send({status: 1, message: `User list fetched`, data: response.users })
    } catch (error) {
        console.log("error", error);
        return res.send({status: 0, message: error.message, data: null })
    }
}

exports.add = (req, res, next) => {
    userSchema.create({ ...req.body }).then((result => {
        res.send('User Added')
    })).catch(error => {
        console.log("error", error.message);
        res.send(error.message)
    })
}

exports.details = async (req, res, next) => {
    const { id } = req.params;
    try {
        const response = await userSchema.findById(id);
        if (response) {
            res.send({ status: 1, data: response, message: 'User data fetched Successfully' });
            return;
        }
        res.send({ status: 0, message: 'User not Found' });
    } catch (error) {
        console.log("error", error);
        res.send({ message: error.message })
    }
}

exports.del = async (req, res, next) => {
    console.log("req.params.id", req.params.id);
    try {
        const response = await userSchema.findOneAndDelete({ _id: req.params.id });
        console.log("response", response);
        if (response) {
            res.send({ status: 1, data: response, message: 'User Deleted Successfully' })
        } else {
            res.send({ status: 0, message: 'User not deleted' })
        }
    } catch (error) {
        console.log("error", error);
        res.send({ message: error.message })
    }
}

exports.update = async (req, res, next) => {
    try {
        const userId = req.userId;
        if(req.body.image){
            const {url, fileId} = await uploadImageToFirebaseAndReturnURL(req);
            console.log("result", url, fileId);
            const profileDetails = await databases.listDocuments(
                process.env.dbId,
                process.env.profileCollectID,
                [
                    Query.equal("userId", userId)
                ]
            );

            if(profileDetails.total){
                console.log("Profile Found");
                await databases.updateDocument(
                    process.env.dbId,
                    process.env.profileCollectID,
                    profileDetails.documents[0].$id,
                    {
                        profilePicture: url,
                        fileId: fileId
                    }
                );
                console.log("profile Updated");
            }else{
                console.log("Profile Not Found");
                await databases.createDocument(
                    process.env.dbId,
                    process.env.profileCollectID,
                    ID.unique(),
                    {
                        userId: userId,
                        profilePicture: url,
                        fileId: fileId
                    }
                );
                console.log("profile Created");
            }
            // await uploadImageToFirebaseAndReturnURL(req,
            //     async (url, fileId) => {
            //         console.log("url", url);
            //         console.log("fileId", fileId);
            //         try {
            //             const profileDetails = await databases.listDocuments(
            //                 process.env.dbId,
            //                 process.env.profileCollectID,
            //                 [
            //                     Query.equal("userId", userId)
            //                 ]
            //             );
            //             if(profileDetails.total){
            //                 await databases.updateDocument(
            //                     process.env.dbId,
            //                     process.env.profileCollectID,
            //                     profileDetails.documents[0].$id,
            //                     {
            //                         profilePicture: url,
            //                         fileId: fileId
            //                     }
            //                 )
            //             }else{
            //                 await databases.createDocument(
            //                     process.env.dbId,
            //                     process.env.profileCollectID,
            //                     ID.unique(),
            //                     {
            //                         userId: userId,
            //                         profilePicture: url,
            //                         fileId: fileId
            //                     }
            //                 )
            //             }
            //         } catch (error) {
            //             return res.send({status: 0, message: error.message, data: null })
            //         }
            //     },
            //     (error) => {
            //         return res.send({status: 0, message: error.message, data: null })
            //     }
            // );
            // const {name, mobile} = req.body;
            if(req.body.name){
                await users.updateName(userId, req.body.name);
            }
            if(req.body.mobile){
                // await users.updatePhone(userId, req.body.mobile);
            }
            const userDetails = await users.get(userId);
            const profile = await databases.listDocuments(
                process.env.dbId,
                process.env.profileCollectID,
                [
                    Query.equal("userId", userId)
                ]
            )
            return res.send({ status: 1, data: {...userDetails, ...profile.documents[0]}, message: 'User updated' });
        }else{
            const {name, mobile} = req.body;
            console.log("userId", userId);
            console.log("mobile", mobile);
            if(name){
                await users.updateName(userId, name);
            }
            if(mobile){
                // await users.updatePhone(userId, mobile);
            }
            const userDetails = await users.get(userId);
            const profile = await databases.listDocuments(
                process.env.dbId,
                process.env.profileCollectID,
                [
                    Query.equal("userId", userId)
                ]
            )
            return res.send({ status: 1, data: {...userDetails, ...profile.documents[0]}, message: 'User updated' }); 
        }
    } catch (error) {
        console.log("error", error);
        return res.send({status: 0, message: error.message, data: null })
    }

    async function uploadImageToFirebaseAndReturnURL(req, successCallback, errorCallback){
        return new Promise(async(res, rej) => {
            try {
                const buffer = Buffer.from(req.body.image.base64, 'base64');
                const fileName = `user_profile_picture_${req.userId}_${ID.unique()}` + getExtensionFromMimeType(req.body.image.type); // Replace with your desired file path and name
                const result = InputFile.fromBuffer(buffer, fileName);
                // const profileDetails = await databases.listDocuments(
                //     process.env.dbId,
                //     process.env.profileCollectID,
                //     [
                //         Query.equal("userId", req.userId)
                //     ]
                // );
                // if(profileDetails.total){
                    // console.log("Profile Found");
                    // const response = await storage.getFile(
                    //     process.env.bucketID,
                    //     profileDetails.documents[0].fileId,
                    // );
                    // if(response){
                    //     console.log("File Found");
                    //     const response = await storage.updateFile(
                    //         process.env.bucketID,
                    //         profileDetails.documents[0].fileId,
                    //         fileName,
                    //     );
                    //     const fileURL = `https://cloud.appwrite.io/v1/storage/buckets/${process.env.bucketID}/files/${response.$id}/view?project=${process.env.projectID}&mode=admin`;
                    //     return res({url: fileURL, fileId: response.$id});
                    // }else{
                        // console.log("File Not Found");
                        const response = await storage.createFile(
                            process.env.bucketID,
                            ID.unique(),
                            result, 
                        );
                        // return `data:image/jpeg;base64,${base64String}`;
                        // const fileURL = `https://cloud.appwrite.io/v1/storage/buckets/${process.env.bucketID}/files/${response.$id}/view?project=${process.env.projectID}`;
                        return res({url: `data:image/jpeg;base64,${req.body.image.base64}`, fileId: response.$id});
                    // }
                // }else{
                //     console.log("Profile Not Found");
                //     const response = await storage.createFile(
                //         process.env.bucketID,
                //         ID.unique(),
                //         result, 
                //     )
                //     const fileURL = `https://cloud.appwrite.io/v1/storage/buckets/${process.env.bucketID}/files/${response.$id}/view?project=${process.env.projectID}&mode=admin`;
                //     return res({url: fileURL, fileId: response.$id});
                // }
                
                // const file = bucket.file(fileName);
                // file.createWriteStream().end(buffer)
                // console.log("success");
                // file.getSignedUrl({ action: 'read', expires: '03-09-2055' })
                // .then((url) => {
                //     console.log('Image URL:', url);
                //     successCallback(url[0]);
                // })
                // .catch((error) => {
                //     console.error('Error getting signed URL:', error);
                // });
            } catch (error) {
                console.log("error", error);
                return rej({error})
            }    
        })

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
}

exports.addAddress = async (req, res, next) => {
    try {
        const BOUNDS = {
            minLat: process.env.warehouseLat,
            maxLat: process.env.lastLocationLat,
            minLng: process.env.warehouseLong,
            maxLng: process.env.lastLocationLong,
        };

        // const {latitude, longitude} = req.body.addresses;
        // console.log("latitude < BOUNDS.minLat", latitude < BOUNDS.minLat);
        // console.log("latitude > BOUNDS.maxLat", latitude > BOUNDS.maxLat);
        // console.log("longitude < BOUNDS.minLng", longitude < BOUNDS.minLng);
        // console.log("longitude > BOUNDS.maxLng", longitude > BOUNDS.maxLng);
        // if (latitude < BOUNDS.minLat || latitude > BOUNDS.maxLat || longitude < BOUNDS.minLng || longitude > BOUNDS.maxLng) {
        //     // alert("You have moved out of the allowed area.");
        //     // Optionally, reset to a valid region or bring the user back within bounds
        //     return res.send({ status: 0, data: null, message: 'You have moved out of the allowed area.'});
        // } else {
            const addressResponse = await databases.createDocument(
                process.env.dbId,
                process.env.addressCollectID,
                ID.unique(),
                {
                    ...req.body.addresses
                }
            );
            const addressesList= await databases.listDocuments(
                process.env.dbId,
                process.env.addressCollectID
            );
            for (const doc of addressesList.documents) {
                if (doc.$id !== addressResponse.$id) {
                    await databases.updateDocument(process.env.dbId, process.env.addressCollectID, doc.$id, { isDefault: false });
                }
            }
            return res.send({ status: 1, data: addressResponse, message: 'User updated' });
        // }
        // const response = await userSchema.find({_id: req.userId});
        // if (response) {
        //     getUpdateAddress(
        //         response,
        //         req,
        //         async (addresses) => {console.log("addresses to add", addresses);
        //             const condition = {
        //                 '_id': req.userId,
        //             };
        //             const update = {
        //                 $set: {
        //                     'data.addresses': addresses, // Use $ to identify the matched array element
        //                 },
        //             };
        //             const resp = await userSchema.findOneAndUpdate(condition, update, { new: true });
        //             console.log("resp", resp);
        //             if (resp) {
        //                 res.send({ status: 1, data: resp, message: 'User updated' });
        //             } else {
        //                 res.send({ status: 0, data: [], message: 'error in User update' });
        //             }
        //         }
        //     )

        // } else {
        //     res.send({ status: 0, message: 'User not updated' })
        // }
    } catch (error) {
        console.log("error", error);
        res.send({ status: 0, data: [], message: error.message })
    }

    function getUpdateAddress(response, req, callback) {
        console.log("response", response);
        let responseCopy = [{data: {...response[0].data}}];
        delete responseCopy[0].data.password;
        console.log("req.body.addresses", req.body.addresses);
        let addresses;
        if (responseCopy[0].data.addresses === "") {
            addresses = [{ ...req.body.addresses, id: getUniqueId() }];
            callback(addresses);
        } else {
            addresses = [...responseCopy[0].data.addresses, { ...req.body.addresses, id: getUniqueId() }];
            callback(addresses);
        }
    }
}

exports.updateAddress = async (req, res, next) => {
    try {
        // const {userId} = req;
        const {id: addressId, addresses} = req.body;

        const response = await databases.updateDocument(
            process.env.dbId,
            process.env.addressCollectID,
            addressId,
            addresses
        );

        console.log("response", response);
        return res.send({status: 1, message: `Address updated successfully !!`, data: response});
    } catch (error) {
        return res.send({status: 0, message: `Address updation failed !! - ${error.message}`, data: null});
    }
}

exports.markDefaultAddress = async (req, res, next) => {
    try {
        const addressId = req.body.id;
        await databases.updateDocument(
            process.env.dbId,
            process.env.addressCollectID,
            addressId,
            {
                isDefault: true
            }
        );
        const addressesList= await databases.listDocuments(
            process.env.dbId,
            process.env.addressCollectID
        );
        for (const doc of addressesList.documents) {
            if (doc.$id !== addressId) {
                await databases.updateDocument(process.env.dbId, process.env.addressCollectID, doc.$id, { isDefault: false });
            }
        }
        res.send({ status: 1, data: addressesList.documents, message: 'User updated' });
    } catch (error) {
        res.send({ status: 0, data: null, message: `Error in User update - ${error.message}` });
    }
    
}

exports.deleteAddress = async (req, res) => {
    try {
        // const {userId} = req;
        const {id: addressId} = req.body;

        await databases.updateDocument(
            process.env.dbId,
            process.env.addressCollectID,
            addressId,
            {
                isActive: false
            }
        );
        return res.send({status: 1, message: `Address deleted successfully !!`, data: null});
    } catch (error) {
        return res.send({status: 0, message: `Address deletion failed !! - ${error.message}`, data: null});
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password, fcmToken } = req.body;
        const user = await userSchema.findOne({ 'data.email': email });
        if (user && await bcrypt.compare(password, user.data.password)) {
            console.log(user);
            if(user.data.isActive){
                const token = jwt.sign({ userId: user._id }, 'freshfarmsJWT');
                const otp = generateOTP();
                sendOTPEmail('', otp);
                const update = {
                    $set: {
                        'data': {...user.data, fcmToken: fcmToken, otp: otp},
                    },
                };
                const options = {
                    new: true,
                };
                await userSchema.findOneAndUpdate({_id: user._id}, update, options)
                let userData = {data:{...user.data, _id: user._id, fcmToken}};
                delete userData.data.password;
                res.json({ status: 1, data: { token: token, userData }, message: 'OTP sent to email successfully' });
            }else{
                res.json({ status: 1, data: null, message: 'Your account is inactive, please contact admin'});
            }
        } else {
            res.json({ status: 0, token: null, message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.send({ status: 0, data: null, message: error.message });
    }
}

exports.register = async (req, res, next) => {
    try {
        const { email, password, name, fcmToken, verifyOtp } = req.body;
        const existingUser = await userSchema.findOne({ 'data.email': email });
        console.log("existingUser", existingUser);
        if (existingUser) {
            if(existingUser.data.isActive){
                if(verifyOtp){
                    if(existingUser.data.otp === verifyOtp){
                        existingUser.data.otp = -1;
                        existingUser.data.isVerified = true;
                        await existingUser.save();
                        res.json({ message: 'Registration successful', status: 1, data: null });
                      }else{
                        res.json({ message: 'Wrong OTP, please enter correct OTP sent on mail', status: 0, data: null });
                      }
                }else{
                    res.send({ message: 'User already exist, please navigate to login screen', data: null, status: 0 });
                }
            }else{
                res.send({ message: 'Your account is In-active, Please contact administrator', data: null, status: 0 });
            }
        }else{
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new userSchema({
                data: {
                    email,
                    password: hashedPassword,
                    name: name,
                    addresses: [],
                    mobile: "",
                    id: getUniqueId(),
                    isVerified: false,
                    isAdmin: false,
                    isActive: true
                },
            });
            const savedUser = await newUser.save();
            const token = jwt.sign({ userId: savedUser._id }, 'freshfarmsJWT');
            const otp = generateOTP();
            sendOTPEmail('', otp);
            const update = {
                $set: {
                    'data': {...savedUser.data, fcmToken: fcmToken, otp: otp, jwtToken: token},
                },
            };
            const options = {
                new: true,
            };
            await userSchema.findOneAndUpdate({_id: savedUser._id}, update, options)
            let userData = {data:{...savedUser.data, _id: savedUser._id, fcmToken: fcmToken}};
            delete userData.data.password;
            res.send({ data: {userData, token}, message: 'OTP sent on email successfully', status: 1 });
        }
        
    } catch (error) {
        res.send({ status: 0, data: null, message: error.message });
    }
}

exports.uploadProfilePicture = async (req, res, next) => {
    console.log("request", req.file)
    try {
        // let user = await userSchema.findOne({_id: req.userId});
        // console.log("user", user);
        // if (!req.file) {
        //     return res.send({ status: 0, data: null, message: 'Please add profile picture' });
        // }
        // bucket.upload(req.file.path, {
        //     metadata: {
        //         metadata: {
        //           firebaseStorageDownloadTokens: req.userId
        //         }
        //     }
        // }).then(async result => {
        //         let file = result[0];
        //         let url = "https://firebasestorage.googleapis.com/v0/b/" + bucket.name + "/o/" + encodeURIComponent(file.name) + "?alt=media&token=" + req.userId;
        //         user.data.profilePicture = url;
        //         await user.save();
        //         return res.send({ status: 1, data: url, message: 'Profile picture uploaded' });
        // }).catch(error => {
        //     res.send({ status: 0, data: null, message: error.message });
        // });
    } catch (error) {
        console.log("error", error);
        res.send({ status: 0, data: null, message: error.message });
    }
}

exports.forgotPassword = async (req, res, next) => {
    try {
      // Check if the email exists in the database
      const user = await userSchema.findOne({ 'data.email': req.body.email });
  
      if (!user) {
        res.json({ status: 0, token: null, message: 'Invalid email or password' });
      }else{
        // Generate and save an OTP
        const otp = generateOTP();
        user.data.otp = otp;
        await user.save();
        console.log("user", user);
        // Send OTP email
        sendOTPEmail(email='', otp);
    
        res.json({ message: 'OTP sent successfully', status: 1, data: {id: user._id} });
      }
      
    } catch (error) {
      console.log(error);
      res.json({ status: 0, data: null, message: 'Internal Server Error' });
    }
};

exports.verifyOTP = async (req, res, next) => {
    const OTP = req.body.otp
    const userId = req.body.userId
    try {
      const user = await userSchema.findOne({ _id: userId });
      if (!user) {
        res.json({ status: 0, token: null, message: 'Invalid email or password' });
      }
      console.log("user", user);
      if(user?.data?.otp === OTP){
        user.data.otp = -1;
        if(!user.data.isVerified){
            user.data.isVerified = true;
            user.data.isActive = true;
        }
        await user.save();
        res.json({ message: 'OTP verified successfully', status: 1, data: {token: user.jwtToken} });
      }else{
        res.json({ message: 'Wrong OTP, please enter correct OTP sent on mail', status: 0, data: null });
      }
    } catch (error) {
      console.log(error);
      res.json({ status: 0, data: null, message: 'Internal Server Error' });
    }
};

exports.updatePassword = async (req, res, next) => {
    const password = req.body.password
    try {
      const user = await userSchema.findOne({ _id: req.userId });
      if (!user) {
        res.json({ status: 0, data: null, message: 'Invalid email or password' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      user.data.password = hashedPassword
      await user.save();
      res.json({ message: 'Passord Reset Successfull', status: 1, data: user });
    } catch (error) {
      console.log(error);
      res.json({ status: 0, data: null, message: error });
    }
};

exports.updatePasswordWithoutAuth = async (req, res, next) => {
    const password = req.body.password
    const userId = req.body.userId
    try {
      const user = await userSchema.findOne({ _id: userId });
      if (!user) {
        res.json({ status: 0, data: null, message: 'Invalid email or password' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      user.data.password = hashedPassword
      await user.save();
      res.json({ message: 'Passord Reset Successfull', status: 1, data: user });
    } catch (error) {
      console.log(error);
      res.json({ status: 0, data: null, message: error });
    }
};

exports.myOrders = async (req, res, next) => {
    const userId = req.userId;
    console.log("userId", userId);
    try {
        const user = await databases.listDocuments(
            process.env.dbId,
            process.env.orderCollectID,
            [
                Query.equal('userId', [userId]),
                Query.limit(1000),
            ]
        )
    res.json({ status: 1, data: user.documents, message: 'Order fetched'});
    //   const user = await userSchema.findOne({ _id: req.userId });
    //   if (!user) {
    //     res.json({ status: 0, data: null, message: 'Invalid email or password' });
    //   }
    //   const ordersList = await orders.find({userId: req.userId});
    //   if(ordersList){
    //     res.json({ status: 1, data: ordersList, message: 'Order fetched' });
    //   }else{
    //     res.json({ status: 0, data: null, message: 'Error while fetching orders' });
    //   }
    } catch (error) {
      console.log(error);
      res.json({ status: 0, data: null, message: error });
    }
};

exports.adminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await userSchema.findOne({ 'data.email': email });
        // if (user && await bcrypt.compare(password, user.data.password)) {
            if (user && (password ===  user.data.password)) {
            if(!user.data.isAdmin){
                res.json({ status: 0, data: null, message: 'Please use these credentials to login via App, you are not an admin' });
            }else{
                const token = jwt.sign({ userId: user._id }, 'freshfarmsJWT');
                let userData = {data:{...user.data, _id: user._id}};
                delete userData.data.password;
                res.json({ status: 1, data: { token, userData }, message: 'Login successfully' });
            }
        } else {
            res.json({ status: 0, token: null, message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.send({ status: 0, data: null, message: error.message });
    }
};

function sendOTPEmail(email, otp){
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
      to: `riyush13@gmail.com`,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}`,
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
};

function generateOTP(){
    return Math.floor(100000 + Math.random() * 900000).toString();
};


//admin

exports.userUpdateAdmin = async (req, res, next) => {
    try {
        const userId = req.body.userId;
        const user = await userSchema.findOne({ _id: userId });
        const data = user.data;
        let payload = {...data, ...req.body.data};
        const update = {
            $set: {
                'data': payload,
            },
        };
    
        const options = {
            new: true,
        };
        const response = await userSchema.findOneAndUpdate({ _id: userId }, update, options);
        if (response) {
            res.send({ status: 1, data: response, message: 'User updated' })
        } else {
            res.send({ status: 0, message: 'Userv not updated' })
        }
    } catch (error) {
        console.log("error", error);
        res.send({ message: error.message })
    }
}

exports.updateUserStatusAdmin = async (req, res, next) => {
    try {
        console.log(req.body);
        const {userId, isActive} = req.body;
        await users.updateStatus(userId, isActive);
        res.send({ status: 1, data: null, message: 'User updated' })
    } catch (error) {
        console.log("error", error);
        res.send({ message: error.message })
    }
}

exports.registerWithAppWrite =  async(req, res, next) => {
    try {
        
    } catch (error) {
        res.send({ status: 0, message: `Registration failed - ${error.message}`, data: null })
        
    }
}

exports.loginWithAppWrite = async(req, res, next) => {
    try {
        const {email} = req.body;
        console.log("email", email);
        if(email){
            const user = await users.list(
                [Query.equal("email", [email])]
            );
            console.log("user", user);
            if(user.total){
                const response = await account.createEmailToken(user.users[0].$id, email);
                const tokenCollection = await databases.listDocuments(
                    process.env.dbId,
                    process.env.tokenCollectID,
                    [Query.equal("userId", [user.users[0].$id])]
                );
                console.log(tokenCollection);
                if(tokenCollection.total){
                    await databases.updateDocument(
                        process.env.dbId,
                        process.env.tokenCollectID,
                        tokenCollection.documents[0].$id,
                        {
                            otp: response.secret
                        }
                    );
                }
                console.log("response", response);
                res.send({ status: 1, message: `OTP Send Successfully`, data: response })
            }else{
                const user = await users.create(
                    ID.unique(),
                    email,
                );
                const response = await account.createEmailToken(user.$id, user.email);
                await databases.createDocument(
                    process.env.dbId,
                    process.env.tokenCollectID,
                    ID.unique(),
                    {
                        otp: response.secret,
                        userId: user.$id,
                        token: ''
                    }
                );
                // res.send({ status: 0, message: `User not found, please register a new account`, data: null })
                res.send({ status: 1, message: `OTP Send Successfully`, data: response })
            }
        } 
    }catch (error) {
        res.send({ status: 0, message: `Login failed - ${error.message}`, data: null })
    }
}

exports.verifyOtpWithAppWrite = async(req, res, next) => {
    try {
        const {userId, otp, fcmToken} = req.body;
        if(userId && otp){
            const response = await databases.listDocuments(
                process.env.dbId,
                process.env.tokenCollectID,
                [Query.equal("otp", [otp])]
            );
            if(response.total){
                const token = jwt.sign({ userId: userId }, 'freshfarmsJWT');
                await databases.updateDocument(
                    process.env.dbId,
                    process.env.tokenCollectID,
                    response.documents[0].$id,
                    {
                        token: token,
                        otp: null,
                        fcmToken: fcmToken
                    }
                );
                const user = await users.get(response.documents[0].userId);
                const profile = await databases.listDocuments(
                    process.env.dbId,
                    process.env.profileCollectID,
                    [
                        Query.equal("userId", userId)
                    ]
                )
                if(fcmToken){
                    await adminInstance.messaging().send({
                        data: {
                          title: `Welcome to Freshfarms !`,
                          body: `Happy Shopping !!`,
                        },
                        token: fcmToken,
                    });
                }
                const encryptedData = CryptoJS.AES.encrypt(JSON.stringify({...response, ...user, ...profile.documents[0], token: token}), 'freshfarms').toString();
                return res.send({ status: 1, message: `Login success`, data: encryptedData})
            }else{
                return res.send({ status: 0, message: `Incorrect OTP`, data: null })
            }
        } else {
            return res.send({ status: 0, message: `Required fields missing`, data: null })
        }
    } catch (error) {
        console.log(error);
        res.send({ status: 0, message: `Login failed - ${error.message}`, data: null })
    }
}

exports.getAddresses = async(req, res, next) => {
    const {userId} = req;
    try {
        const response = await databases.listDocuments(
            process.env.dbId,
            process.env.tokenCollectID,
            [
                Query.equal("userId", [userId])
            ]
        );
        if(response.total){
            const tokenId = response.documents[0].$id;
            const addresses = await databases.listDocuments(
                process.env.dbId,
                process.env.addressCollectID,
                [
                    Query.equal("user", [tokenId]),
                    Query.equal("isActive", true)
                ]
            );
            if(addresses.total){
                res.send({ status: 1, message: `Addresses fetched`, data: addresses})
            }else{
                res.send({ status: 0, message: `No Addresses found`, data: null})
            }
        }
    } catch (error) {
        console.log("error",error);
        res.send({ status: 0, message: `Something went wrong - ${error.message}`, data: null})
    }
}

