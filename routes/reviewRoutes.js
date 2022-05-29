const express = require('express');

const reviewController = require('../controllers/reviewController');

const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true }); // mergeParams is used in order to get access to the parameter (tourId) in the other router tourRoutes.js

// POST : /tour/(tourID)/reviews
// POST : /reviews

router.use(authController.protect);
router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(
        authController.restrictTo('user'),
        reviewController.setTourUserIds,
        reviewController.createReview
    );
router
    .route('/:id')
    .get(reviewController.getReviewById)
    .patch(
        authController.restrictTo('user', 'admin'),
        reviewController.updateReview
    )
    .delete(
        authController.restrictTo('user', 'admin'),
        reviewController.deleteReview
    );

module.exports = router;
