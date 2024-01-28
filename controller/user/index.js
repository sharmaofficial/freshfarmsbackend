var userSchema = require('../../modal/user');
const { getUniqueId } = require('../../utils');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
        const response = await userSchema.findOneAndUpdate({ id: req.params.id }, { ...req.body });
        if (response) {
            res.send({ status: 1, data: [], message: 'User updated' })
        } else {
            res.send({ status: 0, message: 'Userv not updated' })
        }
    } catch (error) {
        console.log("error", error);
        res.send({ message: error.message })
    }
}

exports.addAddress = async (req, res, next) => {
    try {
        const response = await userSchema.find({_id: req.body.id});
        if (response) {
            getUpdateAddress(
                response,
                req,
                async (addresses) => {console.log("addresses to add", addresses);
                    const condition = {
                        '_id': req.body.id,
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
    const userId = req.body.userId;
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

exports.deleteAddress = async (req, res) => {
    try {
        const userId = req.body.userId;
        const addressId = req.body.id;

        const updatedUser = await userSchema.findOneAndUpdate(
            { id: userId },
            {
                $pull: {
                    'data.addresses': { id: addressId },
                },
            },
            { new: true }
        );

        // Check if addresses array is empty, assign to empty array
        if (updatedUser && updatedUser.data.addresses.length === 0) {
            updatedUser.data.addresses = "";
            await updatedUser.save();
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

exports.upload = async (req, res, next) => {
    console.log("request", req)
    try {
        // const isValid = await registrationSchema.validateAsync({...req.body, status: false});
        // let data = {...req.body, status: false}
        // const response = await userSchema.where({...req.body, status: false}); 
        // if(response.length>0){
        //     res.send({message: 'User already exist'})
        // }else{
        //         const response = await userSchema.create(data);
        //         if(response){
        //             res.send({data: response, message: 'Registration successful', status: 1});
        //         }else{
        //             res.send({message: 'Registration Failed', status: 1});
        //         }
        // }
    } catch (error) {
        console.log("error", error);
        console.log("error", error.details[0]);
        error.details[0].type === 'string.pattern.base' ?
            res.send({ message: `invalid ${error.details[0].context.key} format` })
            :
            res.send({ message: error.message })
    }
}

