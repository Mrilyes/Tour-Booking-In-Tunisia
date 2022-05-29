const mongoose = require('mongoose');
const slugify = require('slugify'); // convert the url to string
const validator = require('validator');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
    {
        name: {
            // new mongoose.Schema to specify a schema for our data
            // this is a schema type options
            type: String,
            required: [true, 'A tour must have a name'], // a validator
            unique: true, // the name of the tour is unique
            trim: true,
            maxlength: [
                100,
                'A tour name must have less or equal then 100 characters',
            ], // data validator
            minlength: [
                10,
                'A tour name must have more or equal then 10 characters',
            ], // data validator
            // validate: [
            //     validator.isAlpha,
            //     'Tour name must only contain characters',
            // ],
        },

        // slug mean the unique identifying part of a web adress typically at the end of the url
        slug: String,

        duration: {
            type: Number,
            required: [true, 'A tour must have a duration'],
        },

        maxGroupSize: {
            type: Number,
            required: [true, 'A tour must have a groupSize'],
        },

        difficulty: {
            type: String,
            required: [true, 'A tour must have a difficulty'],
            enum: {
                values: ['easy', 'medium', 'hard'],
                message: 'Difficluty is either : easy , medium or hard',
            },
        },

        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'Rating must be above 1.0'], // data validator
            max: [5, 'Rating must be below 5.0'], // data validator
            set: (val) => Math.round(val * 10) / 10, // 4.666 -> 4.7
        },

        ratingsQuantity: {
            type: Number,
            default: 0,
        },

        price: {
            type: Number,
            required: [true, 'A tour must have a price '],
        },

        priceDiscount: {
            type: Number,
            validate: {
                // validator : custom validator
                validator: function (val) {
                    // this only points to current doc on new document creation
                    // this function is not going to work in update
                    return val < this.price;
                },
                message:
                    'discount price ({VALUE}) should be below the regular price',
            },
        },
        summary: {
            type: String,
            // trim works only on string (remove whitespaces in the beg and in the end of str)
            trim: true,
            required: [true, 'A tour must have a summary '],
        },

        description: {
            type: String,
            trim: true,
            required: [true, 'A tour must have a description '],
        },

        imageCover: {
            type: String,
            required: [true, 'A tour must have a image cover'],
        },

        images: [String],

        createdAt: {
            type: Date,
            default: Date.now(),
            select: false, // to hide it for the user
        },

        startDates: [Date],
        secretTour: {
            type: Boolean,
            default: false,
        },

        startLocation: {
            //Using GeoJson
            type: {
                type: String,
                default: 'Point',
                enum: ['Point'],
            },
            coordinates: [Number],
            address: String,
            description: String,
        },
        // location is an array where I'm gonna specify the objects of startLocation
        // this is an embedded document
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point'],
                },
                coordinates: [Number],
                adress: String,
                description: String,
                day: Number,
            },
        ],
        // guides: Array, //the modeling for tour guide embedding

        guides: [
            //the modeling for tour guide child referencing
            {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
            },
        ],
        // tour referencing reviews(instead of doing it I will use virtual populate)
        // reviews: [
        //     {
        //         type: mongoose.Schema.ObjectId,
        //         ref: 'Review',
        //     },
        // ],
    },
    {
        // to add new a virtual field
        //  cannot be inside the schema
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);
//virtual properties (I define a middleware in the schema)
tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

// virtual popluate (this is how we connect tour with review)
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id',
});

// DOC MIDDLEWARE : runs before the .save() and .create() cmds this middleware will be executed but not .insertMany() and update()🚨🚨
// 'pre' is gonna run before an actual event
// function we be called before an actual doc is saved to the db
// each middleware function in a pre save middleware/hook has access to next
tourSchema.pre('save', function (next) {
    // can be called hook in place of middleware
    // this middleware call a pre save hook
    // console.log(this);
    this.slug = slugify(this.name, { lower: false });
    next();
});

// modeling tour guide embedding
// tourSchema.pre('save', async function (next) {
//     const guidePromises = this.guides.map((id) => User.findById(id));
//     this.guides = await Promise.all(guidePromises);
//     next();
// });

// modeling tour guide referencing

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
    // rgx /^find/ any query that start with find
    this.find({ secretTour: { $ne: true } }); // this refers to the query
    this.start = Date.now();
    next();
});

tourSchema.pre(/^find/, function (next) {
    this.populate('guides');
    next();
});

tourSchema.post(/^find/, function (docs, next) {
    console.log(`Query took ${Date.now() - this.start} milliseconds`);
    // console.log(docs);
    // console.log(this);
    next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
    console.log(this.pipeline());
    next();
});
// the model should always be capitalize
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
