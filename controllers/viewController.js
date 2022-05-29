const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Review = require('./../models/reviewModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('./../error-handling/catchAsync');
const AppError = require('./../error-handling/appError');

exports.alerts = (req, res, next) => {
    const { alert } = req.query;
    if (alert === 'booking')
        res.locals.alert =
            "Your booking was successful! Please check your email for a confirmation. If your booking doesn't show up here immediatly, please come back later.";
    next();
};

exports.getAllTour = async (req, res) => {
    // 1) get tour data from collection
    const tours = await Tour.find();
    // 2) build template (allTour.pug)
    // 3) render the template using tour data from 1)
    res.status(200).render('allTour', {
        title: 'Tours',
        tours,
    });
};

exports.getTour = catchAsync(async (req, res, next) => {
    // 1) Get the data, for the requested tour (including reviews and guides)
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user',
    });

    if (!tour) {
        return next(new AppError('There is no tour with that name.', 404));
    }

    // Now we have access to user and tour. So now here we can determine
    // if tour is booked or not.

    const booking = await Booking.findOne({
        user: res.locals.user,
        tour: tour,
    });

    let commentExist;
    if (res.locals.user) {
        commentExist = tour.reviews.some(
            (review) => review.user.id === res.locals.user.id
        );
    }

    let booked;

    if (booking) {
        booked = true;
    } else {
        booked = false;
    }

    // 2) Build template
    // 3) Render template using data from 1)
    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour,
        booked,
        commentExist,
    });
});

exports.getSignupForm = (req, res) => {
    res.status(200).render('signup', {
        title: 'create your account!',
    });
};

exports.getLoginForm = (req, res) => {
    res.status(200).render('login', {
        title: 'Log into your account',
    });
};

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your account',
    });
};

exports.getMyTours = async (req, res, next) => {
    // 1) Find all bookings
    const bookings = await Booking.find({ user: req.user.id });
    if (!bookings) res.send('nobooking');
    // 2) Find tours with the returned IDs
    const tourIDs = bookings.map((el) => el.tour);
    const tours = await Tour.find({ _id: { $in: tourIDs } });
    // Render the page that contains the booked travels
    if (tourIDs.length === 0) {
        res.status(200).render('nobooking');
    } else {
        res.status(200).render('allTour', {
            title: 'My Tours',
            tours,
        });
    }
};

exports.forgotPassword = async (req, res) => {
    res.status(200).render('forgotPassword', {
        title: 'forgotpassword',
    });
};

exports.resetPassword = (req, res) => {
    res.status(200).render('resetPassword', {
        title: 'reset password',
        token: req.params.token,
    });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
            name: req.body.name,
            email: req.body.email,
        },
        {
            new: true,
            runValidators: true,
        }
    );

    res.status(200).render('account', {
        title: 'Your account',
        user: updatedUser,
    });
});

exports.getMyReviews = catchAsync(async (req, res, next) => {
    // 1) Get reviews of the currently logged in user
    const reviews = await Review.find({ user: res.locals.user.id }).populate({
        path: 'tour',
        select: 'name slug',
    });

    res.status(200).render('reviews', {
        title: 'My reviews',
        reviews,
        toursNames: true,
    });
});
