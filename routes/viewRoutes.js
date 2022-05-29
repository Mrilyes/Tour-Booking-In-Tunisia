const express = require('express');

const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.get('/', authController.isLoggedIn, viewController.getAllTour);

router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);

router.get('/signup', authController.isLoggedIn, viewController.getSignupForm);

router.get('/login', authController.isLoggedIn, viewController.getLoginForm);

router.get('/forgotpassword', viewController.forgotPassword);

router.get('/resetpassword/:token', viewController.resetPassword);

router.get('/me', authController.protect, viewController.getAccount);

router.get(
    '/my-reviews',
    authController.isLoggedIn,
    viewController.getMyReviews
);

router.get(
    '/my-tours',
    bookingController.createBookingCheckout,
    authController.protect,
    viewController.getMyTours
);

router.post(
    '/submit-user-data',
    authController.protect,
    viewController.updateUserData
);

module.exports = router;
