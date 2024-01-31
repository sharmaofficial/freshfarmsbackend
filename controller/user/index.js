var userSchema = require('../../modal/user');
const { getUniqueId } = require('../../utils');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

var admin = require("firebase-admin");

var serviceAccount = require("../../utils/serviceAccountKey.json");
const orders = require('../../modal/order');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fresh-farms-2bbdf-default-rtdb.asia-southeast1.firebasedatabase.app",
  storageBucket: process.env.BUCKET_URL
});

let bucket = admin.storage().bucket();

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
        const user = await userSchema.find({ _id: userId });
        const data = user[0].data;
        console.log("req.file", req.body);
        if(req.body.image){
            uploadImageToFirebaseAndReturnURL(req,
                async (url) => {
                    let payload = {...data, ...req.body, profilePicture: url};
                    console.log("payload in if", payload);
            
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
            console.log("payload in else", payload);
    
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
        if (updatedUser && updatedUser.data.addresses.length === 0) {
            updatedUser.data.addresses = "";
        }

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
        const { email, password } = req.body;
        const user = await userSchema.findOne({ 'data.email': email });
        if (user && await bcrypt.compare(password, user.data.password)) {
            const token = jwt.sign({ userId: user._id }, 'freshfarmsJWT', { expiresIn: '1h' });
            let userData = {data:{...user.data, _id: user._id}};
            delete userData.data.password;
            res.json({ status: 1, data: { token, userData }, message: 'Login successful' });
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
        const { email, password, name } = req.body;
        const existingUser = await userSchema.findOne({ 'data.email': email });
        if (existingUser) {
            res.send({ message: 'User already exist', data: savedUser, status: 0 });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new userSchema({
            data: {
                email,
                password: hashedPassword,
                name: name,
                addresses: [],
                mobile: "",
                id: getUniqueId()
            },
        });
        const savedUser = await newUser.save();
        res.send({ data: savedUser, message: 'Registration successful', status: 1 });
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
      const user = await userSchema.findOne({ _id: req.userId });
  
      if (!user) {
        res.json({ status: 0, token: null, message: 'Invalid email or password' });
      }
  
      // Generate and save an OTP
      const otp = generateOTP();
      user.data.otp = otp;
      await user.save();
  
      // Send OTP email
      sendOTPEmail(email='', otp);
  
      res.json({ message: 'OTP sent successfully', status: 1 });
      
    } catch (error) {
      console.log(error);
      res.json({ status: 0, data: null, message: 'Internal Server Error' });
    }

    function generateOTP(){
        return Math.floor(100000 + Math.random() * 900000).toString();
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
};

exports.verifyOTP = async (req, res, next) => {
    const OTP = req.body.otp
    try {
      const user = await userSchema.findOne({ _id: req.userId });
      if (!user) {
        res.json({ status: 0, token: null, message: 'Invalid email or password' });
      }
      console.log("user.data.otp", user.data.otp);
      console.log("OTP", OTP);
      if(user.data.otp === OTP){
        user.data.otp = -1;
        await user.save();
        res.json({ message: 'OTP verified successfully', status: 1, data: null });
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

exports.myOrders = async (req, res, next) => {
    const userId = req.userId;
    console.log("req.userId", req.userId);
    try {
      const user = await userSchema.findOne({ _id: req.userId });
      if (!user) {
        res.json({ status: 0, data: null, message: 'Invalid email or password' });
      }
      const ordersList = await orders.find({userId: user.data.id});
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

