const express = require('express');

const path = require('path');

const morgan = require('morgan'); // logger

const rateLimit = require('express-rate-limit');

const tourRouter = require('./routes/tourRoutes');

const userRouter = require('./routes/userRoutes');

const reviewRouter = require('./routes/reviewRoutes');

const bookingRouter = require('./routes/bookingRoutes');

const viewRouter = require('./routes/viewRoutes');

const cookieParser = require('cookie-parser');

const helmet = require('helmet'); // setting security http headers

const compression = require('compression');

const mongoSanitize = require('express-mongo-sanitize');

const xss = require('xss-clean');

const hpp = require('hpp');

const app = express();

app.set('view engine', 'pug'); // set pug to express

app.set('views', path.join(__dirname, 'views')); // set views

// serve static files from a folder and not from the route
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// body parser , reading data from body into req.body
// express.json() to get access to the request body on the request object (req.body)
app.use(express.json());

// data sanitization against nosql query injection
app.use(mongoSanitize()); // this middleware will look for the req.body , the req.query  string and also req.params for the purpose of security and to avoid the query injection attack to log in

// data sanitization against xxs ("email" : {"$gt":""},) can log to the app without register
app.use(xss()); // using this middleware we prevent that by converting all these httml symbols

// prevent parameter pollution
app.use(
    hpp({
        // whitelist is an array of properties that allow duplicates in the query string
        whitelist: [
            'duration',
            'ratingsQuantity',
            'ratingsAverage',
            'maxGroupSize',
            'difficulty',
            'price',
        ],
    })
);

app.use(compression());

// console.log(process.env.NODE_ENV);

// app.use(morgan('dev'));

// Global middleware
//set security http headers
app.use(helmet());

// dev logging
if (process.env.NODE_ENV === 'developement') {
    app.use(morgan('dev'));
}

// limit requests from same api
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP please try again...',
});
app.use('/api', limiter);

// body parser , reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));

// this provide us to get the updating user data
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// parse the data from cookies
app.use(cookieParser());

// middleware function
app.use((req, res, next) => {
    console.log('hello from the middleware');
    next();
});
// Test middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.cookies);
    next();
});
// Routes

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

module.exports = app;
