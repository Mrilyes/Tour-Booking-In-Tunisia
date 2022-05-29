const User = require('./../models/userModel');
const sharp = require('sharp');
const multer = require('multer');
const AppError = require('./../error-handling/appError');
const factory = require('./handlerFactory');

// https://github.com/expressjs/multer
// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {
//         const extension = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${extension}`);
//     },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(
            new AppError('Not an image! Please upload only images.', 400),
            false
        );
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = (req, res, next) => {
    if (!req.file) return next();
    // 2nd method (instead of having to write file to the disk and read it again , just simply keep the image in the memory and then read it)
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`);
    next();
};

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

// 2) ROUTE HANDLERS

exports.getMe = async (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

exports.updateMe = async (req, res, next) => {
    // console.log(req.file);
    // console.log(req.body);
    // 1) create error if the user post pwd data
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'This route is not for pwd updates , please use /updateMyPassword',
                400
            )
        );
    }
    // the fields are allowed to update only name and email
    // 2) Filtered out unwanted fields names that are not allowed to be updated
    const filtredBody = filterObj(req.body, 'name', 'email');

    // adding the photo property to the object that will be updated in updateUser
    if (req.file) filtredBody.photo = req.file.filename;
    // 3) update user doc
    const updateUser = await User.findByIdAndUpdate(req.user.id, filtredBody, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        status: 'success',
        data: {
            user: updateUser,
        },
    });
};

exports.deleteMe = async (req, res, next) => {
    await User.findByIdAndDelete(req.user.id, { active: false });
    res.status(204).json({
        status: 'success',
        data: null,
    });
};

// factory handler
exports.getAllUsers = factory.getAll(User);
exports.getUserById = factory.getOne(User);
// Do NOT update passwords with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
