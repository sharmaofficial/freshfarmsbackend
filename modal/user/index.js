var mongoose = require('mongoose');

let userSchema = new mongoose.Schema({
    // name:{
    //     type: String,
    //     required: true,
    //     unique: false,
    // },
    // email:{
    //     type: String,
    //     required: true,
    //     unique: true,
    // },
    // password:{
    //     type: String,
    //     required: true,
    //     unique: false,
    // },
    // status:{
    //     type: String,
    //     required: true,
    //     unique: false,
    // }s
    data: {
        addresses: { type: mongoose.Schema.Types.Mixed },
        email: String,
        mobile: String,
        name: String,
        password: String,
        id: String,
        profilePicture: String,
        otp: Number,
        fcmToken: {type: String, required: false},
        isVerified: Boolean,
        isAdmin: {
            type: Boolean,
            require: true
        },
        isActive: {
            type: Boolean,
            require: true
        },
        jwtToken: String
    },
});

const user = mongoose.model('users', userSchema, 'users');
module.exports = user;