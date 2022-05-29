const crypto = require('crypto'); // node module

const { promisify } = require('util'); //promisify it is basically used to convert a method that returns responses using a callback function to return responses in a promise object

const catchAsync = require('./../error-handling/catchAsync');

const User = require('./../models/userModel');

const sendEmail = require('./../nodemailer/email');

const jwt = require('jsonwebtoken');

const AppError = require('./../error-handling/appError');

// the signToken is the token that will give the user the authorization to logged into the app
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const createSendToken = async (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 // 3mths
        ),

        // this means that I cannot manipulate the cookie in the browser in any way not even destroy it
        httpOnly: true,
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    // create a cookie

    res.cookie('jwt', token, cookieOptions);

    // remove password from output
    user.password = undefined;
    res.status(201).json({
        status: 'success',
        token,
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
    });

    createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body; // {email} replace email = req.body.email and password = req.body.password

    // 1) check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }
    // 2) check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');
    // the variable user is now user document because it's a result of querying the user model
    // calling the function correctPassword from userModel
    const correct = await user.correctPassword(password, user.password);
    if (!user || !correct) {
        return next(new AppError('Incorrect email or password!', 400));
    }
    // console.log(user);
    // 3) If everything ok , send token to client
    createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000), // 10sec
        httpOnly: true,
    });
    res.status(200).json({
        status: 'success',
    });
};

// this middleware is for a security purpose(to pretect any route)
// for auth users
// this only for api purpose
exports.protect = catchAsync(async (req, res, next) => {
    // 1) getting token and check if it exist
    let token;
    // can auth users based on authorization header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }
    // can auth users based on tokens send via cookies
    else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    if (!token) {
        return next(
            new AppError('You are not logged in! Login to get access...', 401)
        );
    }

    // 2) verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // console.log(decoded);

    // 3) check if user still exists
    // no one changed the json web token so we can get currentuser
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(
            new AppError(
                'The user belonging to this token does no longer exist',
                401
            )
        );
    }
    // 4) check if user changed password after the jwt was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
            new AppError(
                'User recently changed password! Please log in again.',
                401
            )
        );
    } // iat (issued at)

    // GRANT ACCESS TO PROTECTED ROUTE
    // if the user did not changed the password after jwt issued then we make it to all the way to the end of the middleware function where we assign the currentUser to req.user so we can then use it to the next middleware function
    // because the req object is the one that travel from middleware to another
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});

// only for redered pages , no errors!
exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            // 1) verify token
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET
            );

            // 2) Check if user still exists
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }

            // 3) Check if user changed password after the token was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }

            // THERE IS A LOGGED IN USER
            // user is a variable which the pug template will get access to them so each of the pug template will have access to response .locals and whatever we put there will be variable inside of these templates (like passing data into a template using the render function )
            res.locals.user = currentUser;
            // req.user = currentUser (no longer need because I will put the current user on response .locals )
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin', 'lead-guide'].
        if (!roles.includes(req.user.role)) {
            //role='user' or role='guide'
            return next(
                new AppError(
                    'You do not have permission to perform this action',
                    403
                )
            );
        }
        next();
    };
};

exports.forgotPassword = async (req, res, next) => {
    // 1) get user based on posted email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(
            new AppError('The is no user with this email address', 404)
        );
    }
    // 2) generate the random reset token
    const resetToken = user.createPasswordResetToken();
    // validateBeforeSave : turn off the validation of the pwd
    await user.save({ validateBeforeSave: false });
    // 3) send it to user's email
    const resetURL = `${req.protocol}://${req.get(
        'host'
    )}/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to:
    <button>
        <a href="${resetURL}">
        click here to reset your password
        </a>
    </button> `;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token(valid for 10min)',
            message,
        });
        res.status(200).json({
            status: 'success',
            message: 'Token send to email!',
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(
            new AppError(
                'There was an error sending the email .Try again later'
            ),
            500
        );
    }
};

exports.resetPassword = async (req, res, next) => {
    // 1) get user based on the token(encrypt the token and compare it with the encrypted one in the db)
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    // 2) if token has not expired , and there is user , set the new pwd
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 404));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    // 3) update changePasswordAt property for the user

    // 4) log the user in , send JWT
    createSendToken(user, 200, res);
};

exports.updatePassword = async (req, res, next) => {
    //1) get user from collection
    const user = await User.findById(req.user.id).select('+password');
    //2) check if posted current pwd is correct
    if (
        // compare current password with you new user pwd
        !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
        return next(new AppError('Your current password is wrong', 401));
    }
    //3) if the pwd correct then update pwd
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdata will not work as intended
    createSendToken(user, 200, res);
    //4) log user in (send jwt)
};
