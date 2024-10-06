const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
}
)


//validate password
userSchema.methods.passwordIsValid = async function (inputPassword) {
    return await bcrypt.compare(inputPassword, this.password)
}

//model exports
module.exports = mongoose.model('User', userSchema)
