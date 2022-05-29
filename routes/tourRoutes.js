const express = require('express');

const tourController = require(`${__dirname}/../controllers/tourController`);

const authController = require('./../controllers/authController');

const reviewRoutes = require('./reviewRoutes');
const router = express.Router(); // create a new router

// 3) ROUTES ( a router itself is a middleware)

// nested routes using mergeParams in reviewsRoutes.js
router.use('/:tourId/reviews', reviewRoutes);

router
    .route('/top-5-cheap')
    .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
    .route('/monthly-plan/:year')
    .get(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide', 'guide'),
        tourController.getMonthlyPlan
    );

// router.route('/tours-within/:distance/center/:latlng/unit/:unit');

router
    .route('/')
    // authController.protect will protect the access to this resource here from users that are not logged in
    // the user must have a token so he can access to getAlltours route
    .get(tourController.getAllTours)
    .post(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.createTour
    );

// the next routers are restricted only to the admin and laed-guide and it is protected
router.use(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide')
);
router
    .route('/:id')
    .get(tourController.getTourById)
    .patch(tourController.updateTour)
    .delete(tourController.deleteTour);

module.exports = router; // exporting router so can use it
