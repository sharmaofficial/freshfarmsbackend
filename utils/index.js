const { v4: uuidv4 } = require('uuid');

exports.getUniqueId = () => {
    return uuidv4();
}