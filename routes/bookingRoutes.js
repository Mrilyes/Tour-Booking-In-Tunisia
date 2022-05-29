const express = require('express');

const bookingController = require('./../controllers/bookingController');

const authController = require('./../controllers/authController');

//implemented nested booking routes: /tours/:id/bookings in tourRoutes.js and /users/:id/bookings in usersRoutes.js
const router = express.Router({ mergeParams: true });

router.use(authController.protect);
// this route will only be for client to get the chekcout session
router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

router.use(authController.restrictTo('admin', 'lead-guide'));

router
    .route('/')
    .get(bookingController.getAllBookings)
    .post(bookingController.createBooking);

router
    .route('/:id')
    .get(bookingController.getBooking)
    .patch(bookingController.updateBooking)
    .delete(bookingController.deleteBooking);

module.exports = router;
