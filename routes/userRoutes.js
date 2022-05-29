const express = require('express');

const userController = require('./../controllers/userController');

const authController = require('./../controllers/authController');

const reviewController = require('./../controllers/reviewController');

const router = express.Router();

// 3) ROUTES

// 1st method
// router.route('/signup').post(authController.signup);
// 2nd method ( cause we only have one only http method)
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// To protect all the routes that come after this middleware because the middleware runs in sequence
// the rest of the middlewares that comes after this middleware are now protected.
// don't need to add  authController.protect to each endpoint middleware
router.use(authController.protect); //this middleware is a trick to protect all the next routes

router.patch('/updateMyPassword', authController.updatePassword);

router.get('/me', userController.getMe, userController.getUserById);

router.patch(
    '/updateMe',
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.updateMe
);

router.delete('/deleteMe', userController.deleteMe);

router.route('/').get(userController.getAllUsers);

// the next route is restricted only to the admin
router.use(authController.restrictTo('admin'));

router
    .route('/:id')
    .get(userController.getUserById)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;
