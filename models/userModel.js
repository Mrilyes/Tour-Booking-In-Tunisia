const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto'); // node module
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name!'],
    },

    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email'],
    },

    photo: { type: String, default: 'default.jpg' },

    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user',
    },

    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false,
    },

    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            // This only works on CREATE() and SAVE() !!!
            validator: function (el) {
                return el === this.password;
            },
            message: 'Passwords are not the same!',
        },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date, // this reset will expires after a certain amount of time as a security measure(exp : you only have 10min to reset your pwd)
    //visibility
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
});

// query middleware (pre save hook or pre middleware on save)

userSchema.pre('save', async function (next) {
    // only run this function if password was actually modified
    if (!this.isModified('password')) return next();

    // bcrypt : is a very popluar hashing alogrithm

    // has the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    // delete passwordconfirm field
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.pre(/^find/, function (next) {
    // this points to the current query
    this.find({ active: { $ne: false } });
    next();
});

// instance method is a method that's it's gonna be available on all docs of a certain collection
userSchema.methods.correctPassword = async function (
    candidatePassword,
    userPassword
) {
    //condidatePassword is not hashed but userpassword is hashed
    return await bcrypt.compare(candidatePassword, userPassword); // compare will return true if condidatePassword and userPassword are the same
};

// jwttimestamp uses the number of seconds beside javascript date uses the number of milliseconds(changedTimestamp) .
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        // console.log(changedTimestamp, JWTTimestamp);
        return JWTTimestamp < changedTimestamp;
    }
    // false means not changed
    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    // this token is actually what we're gonna send to the user and so it's like a reset pwd that the user then can use to create a new real pwd
    // only the user will have access to this token
    // for security it should never store a resettoken in the db
    // crypto: deals with an algorithm that performs data encryption and decryption. This is used for security purpose like user authentication where storing the password in Database in the encrypted form
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    // console.log({ resetToken }, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10min

    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
