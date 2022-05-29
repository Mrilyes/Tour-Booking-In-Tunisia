const mongoose = require('mongoose');
const Tour = require('./tourModel');
const User = require('./userModel');

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'Review can not be empty!'],
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour.'],
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user'],
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// to avoid duplicating review from the same
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// populate tour and user so can be shown when we get a tour
reviewSchema.pre(/^find/, function (next) {
    // turned off cause it create an inefficient chain of populates

    // this.populate({
    //     path: 'tour',
    //     select: 'name',
    // })
    this.populate({
        path: 'user',
        select: 'name photo',
    });
    next();
});

// clculating average rating on tours using aggrigation pipeline
reviewSchema.statics.calcAverageRatings = async function (tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId },
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' },
            },
        },
    ]);
    // console.log(stats);
    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating,
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5,
        });
    }
};

// this middleware is used each time the review is created
reviewSchema.post('save', function () {
    // this points to current review
    // constructor point to the model who created that document
    this.constructor.calcAverageRatings(this.tour);
});

//findByIdAndUpdate
//findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.r = await this.findOne(); // r refers to review
    // console.log(this.r);
    next();
});
// passing the data from the pre middleware to the post middleware
reviewSchema.post(/^findOneAnd/, async function () {
    // await this.findOne // does not work here , cause query has already executed
    await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
