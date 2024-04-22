const jwt = require('jsonwebtoken');

const verifyToken = (excludePaths) => (req, res, next) => {
    if (excludePaths.some(path => req.originalUrl.startsWith(path))) {
        return next();
    }
    const token = req.headers.authorization;
    if (!token) {
        res.send({status: 0, message: 'No token provided', data: null})
    }
    jwt.verify(token, 'freshfarmsJWT', (err, decoded) => {
        if (err) {
            res.send({status: 0, message: 'Invalid token', data: null})
        }
        req.userId = decoded.userId;
        next();
    });
};

module.exports = verifyToken;
