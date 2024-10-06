const crypto = require('crypto')

function generateSecretKey(size = 64) {
    return crypto.randomBytes(size).toString('hex')
}

const accessTokenSecret = generateSecretKey(32)

const refreshTokenSecret = generateSecretKey(32)

console.log('ACCESS_TOKEN_SECRET=', accessTokenSecret)
console.log('REFRESH_TOKEN_SECRET=', refreshTokenSecret)