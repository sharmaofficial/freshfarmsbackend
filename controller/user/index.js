var userSchema = require('../../modal/user');
const { getUniqueId, adminInstance } = require('../../utils');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const orders = require('../../modal/order');
const { ObjectId } = require('mongodb');
const { account, users, databases } = require('../../database');
const { ID, Query } = require('node-appwrite');

let bucket = adminInstance.storage().bucket();

exports.list = (req, res, next) => {
    userSchema.find({}, (err, result) => {
        if (err) throw err
        res.send({ status: 1, message: 'User list fetched', data: result })
    })
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
        const user = await userSchema.findOne({ _id: userId });
        const data = user.data;
        if(req.body.image){
            uploadImageToFirebaseAndReturnURL(req,
                async (url) => {
                    let payload = {...data, ...req.body, profilePicture: url};
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
                },
            )
        }else{
            let payload = {...data, ...req.body};
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
        }

    } catch (error) {
        console.log("error", error);
        res.send({ message: error.message })
    }

    function uploadImageToFirebaseAndReturnURL(req, successCallback, errorCallback){
        try {
            const buffer = Buffer.from(req.body.image.base64, 'base64');
            const fileName = `user_profile_picture_${req.userId}${getUniqueId()}` + getExtensionFromMimeType(req.body.image.type); // Replace with your desired file path and name
            const file = bucket.file(fileName);
            file.createWriteStream().end(buffer)
            console.log("success");
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
}

exports.addAddress = async (req, res, next) => {
    try {
        const response = await userSchema.find({_id: req.userId});
        if (response) {
            getUpdateAddress(
                response,
                req,
                async (addresses) => {console.log("addresses to add", addresses);
                    const condition = {
                        '_id': req.userId,
                    };
                    const update = {
                        $set: {
                            'data.addresses': addresses, // Use $ to identify the matched array element
                        },
                    };
                    const resp = await userSchema.findOneAndUpdate(condition, update, { new: true });
                    console.log("resp", resp);
                    if (resp) {
                        res.send({ status: 1, data: resp, message: 'User updated' });
                    } else {
                        res.send({ status: 0, data: [], message: 'error in User update' });
                    }
                }
            )

        } else {
            res.send({ status: 0, message: 'User not updated' })
        }
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
    const userId = req.userId;
    const addressId = req.body.id;

    const existingUser = await userSchema.findById(userId);

    if (!existingUser) {
        return res.send({ status: 0, message: 'User not found' });
    }

    const existingAddresses = existingUser.data.addresses || [];

    const updatedAddresses = existingAddresses.map((address) => {
        if (address.id === addressId) {
            return {
                id: addressId,
                ...req.body.addresses,
            };
        }
        return address;
    });

    const update = {
        $set: {
            'data.addresses': updatedAddresses,
        },
    };

    const options = {
        new: true,
    };

    const updatedUser = await userSchema.findOneAndUpdate(
        { _id: userId },
        update,
        options
    );

    if (updatedUser) {
        res.send({ status: 1, data: updatedUser, message: 'User updated' });
    } else {
        res.send({ status: 0, data: [], message: 'Error in User update' });
    }
}

exports.markDefaultAddress = async (req, res, next) => {
    const userId = req.userId;
    const addressId = req.body.id;

    const existingUser = await userSchema.findById(userId);

    if (!existingUser) {
        return res.send({ status: 0, message: 'User not found' });
    }

    const existingAddresses = existingUser.data.addresses || [];

    const updatedAddresses = existingAddresses.map((address) => {
        if (address.id === addressId) {
            return {
                ...address,
                isDefault: true 
            };
        }else{
            return {
                ...address,
                isDefault: false 
            };
        }
    });

    const update = {
        $set: {
            'data.addresses': updatedAddresses,
        },
    };

    const options = {
        new: true,
    };

    const updatedUser = await userSchema.findOneAndUpdate(
        { _id: userId },
        update,
        options
    );

    if (updatedUser) {
        res.send({ status: 1, data: updatedUser, message: 'User updated' });
    } else {
        res.send({ status: 0, data: [], message: 'Error in User update' });
    }
}

exports.deleteAddress = async (req, res) => {
    try {
        const userId = req.userId;
        const addressId = req.body.id;

        const updatedUser = await userSchema.findOneAndUpdate(
            { _id: userId },
            {
                $pull: {
                    'data.addresses': { id: addressId },
                },
            },
            { new: true }
        );
        await updatedUser.save();
        // Check if addresses array is empty, assign to empty array
        if (updatedUser) {
            res.json({ status: 1, data: updatedUser, message: 'Address deleted successfully' });
        } else {
            res.json({ status: 0, data: [], message: 'Error in deleting address' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.json({ status: 0, data: [], message: error.message });
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
        let user = await userSchema.findOne({_id: req.userId});
        console.log("user", user);
        if (!req.file) {
            return res.send({ status: 0, data: null, message: 'Please add profile picture' });
        }
        bucket.upload(req.file.path, {
            metadata: {
                metadata: {
                  firebaseStorageDownloadTokens: req.userId
                }
            }
        }).then(async result => {
                let file = result[0];
                let url = "https://firebasestorage.googleapis.com/v0/b/" + bucket.name + "/o/" + encodeURIComponent(file.name) + "?alt=media&token=" + req.userId;
                user.data.profilePicture = url;
                await user.save();
                return res.send({ status: 1, data: url, message: 'Profile picture uploaded' });
        }).catch(error => {
            res.send({ status: 0, data: null, message: error.message });
        });
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
    console.log("req.userId", req.userId);
    try {
      const user = await userSchema.findOne({ _id: req.userId });
      if (!user) {
        res.json({ status: 0, data: null, message: 'Invalid email or password' });
      }
      const ordersList = await orders.find({userId: req.userId});
      if(ordersList){
        res.json({ status: 1, data: ordersList, message: 'Order fetched' });
      }else{
        res.json({ status: 0, data: null, message: 'Error while fetching orders' });
      }
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
        const userId = req.body.userId;
        const update = {
            $set: {
                'data.isActive': req.body.isActive,
            },
        };
    
        const options = {
            returnOriginal: false
        };
        const response = await userSchema.findOneAndUpdate({ _id: ObjectId(userId) }, update, options);
        if (response) {
            res.send({ status: 1, data: response, message: 'User updated' })
        } else {
            res.send({ status: 0, message: 'User not found' })
        }
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
        if(email){
            const user = await users.list(
                [Query.equal("email", [email])]
            );
            console.log("user", user);
            if(user.total){
                const response = await account.createEmailToken(user.users[0].$id, email);
                const tokenCollection = await databases.listDocuments(
                    process.env.dbID,
                    process.env.tokenCollectID,
                    [Query.equal("userId", [user.users[0].$id])]
                );
                console.log(tokenCollection);
                if(tokenCollection.total){
                    await databases.updateDocument(
                        process.env.dbID,
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
                    process.env.dbID,
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
        const {userId, otp} = req.body;
        if(userId && otp){
            // res.send({ status: 0, message: `Login failed`, data: null })
            const response = await databases.listDocuments(
                process.env.dbID,
                process.env.tokenCollectID,
                [Query.equal("otp", [otp])]
            );
            if(response.total){
                const token = jwt.sign({ userId: userId }, 'freshfarmsJWT');
                await databases.updateDocument(
                    process.env.dbID,
                    process.env.tokenCollectID,
                    response.documents[0].$id,
                    {
                        token: token,
                        otp: null
                    }
                );
                const user = await users.get(response.documents[0].userId);
                res.send({ status: 1, message: `Login success`, data:  {...response, ...user, token: token}})
            }else{
                res.send({ status: 0, message: `Incorrect OTP`, data: null })
            }
        } 
    } catch (error) {
        console.log(error);
        res.send({ status: 0, message: `Login failed - ${error.message}`, data: null })
    }
}

