const jwt = require('jsonwebtoken')
const createError = require('http-errors')
require('dotenv').config()

const signAccessToken = (userId) => {
    return new Promise((resolve, reject) => {
        const payload = { userId }
        const secret = process.env.ACCESS_TOKEN_SECRET
        const options = {
            expiresIn: '1h',
            issuer: 'gradblog.com',
            audience: userId,
        }

        jwt.sign(payload, secret, options, (err, token) => {
            if(err) {
                reject(createError.InternalServerError('Error signing access token: ' + err.message))
            }
            resolve(token)
        })

    })
}

const signRefreshToken = (userId) => {
    return new Promise((resolve, reject) => {
        const payload = { userId }
        const secret = process.env.REFRESH_TOKEN_SECRET
        const options = {
            expiresIn: '2h',
            issuer: 'gradblog.com',
            audience: userId,
        }

        jwt.sign(payload, secret, options, (err, token) => {
            if (err) {
                reject(createError.InternalServerError('Error signing refresh token: ' + err.message))
            }
            resolve(token)
        })
    })
}

const verifyAccessToken = (req, res, next) => {
    if (!req.headers['authorization']) return next(createError.Unauthorized());

    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader.split(' ');
    const token = bearerToken[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
        if (err) {
            const message = err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message;
            return next(createError.Unauthorized(message));
        }
        req.payload = payload;
        next();
    });
};

const verifyRefreshToken = (refreshToken) => {
    return new Promise((resolve, reject) => {
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, payload) => {
            if (err) {
                reject(createError.Unauthorized('Invalid refresh token'));
            }
            resolve(payload.aud)  // Return audience (userId)
        });
    });
};


module.exports = {
    signAccessToken,
    signRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
}