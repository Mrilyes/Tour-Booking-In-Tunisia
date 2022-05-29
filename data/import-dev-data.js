// this is an importing dev data
// this script will load the data from the json file into the database
// This script is compeletly independent of the rest of the express app

const fs = require('fs');

const mongoose = require('mongoose');

const dotenv = require('dotenv');

const Tour = require('./../models/tourModel');

const User = require('./../models/userModel');

const Review = require('./../models/reviewModel');

dotenv.config({ path: './config.env' });

//  connection string
const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

mongoose
    .connect(DB, {
        // the connect method is gonna return a promise (to handle it use .then)
        // some options to deal with some deprecation warnings
        // usually the most used in every application
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('DB connection successful...');
    })
    .catch((err) => {
        console.log('ERROR...');
    });

// Read JSON File
const tours = JSON.parse(
    fs.readFileSync(`${__dirname}/../dev-data/data/tours.json`)
);
const users = JSON.parse(
    fs.readFileSync(`${__dirname}/../dev-data/data/users.json`)
);
const reviews = JSON.parse(
    fs.readFileSync(`${__dirname}/../dev-data/data/reviews.json`)
);

// Import data into db
const importData = async () => {
    try {
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false });
        await Review.create(reviews);
        console.log('data successfully loaded...😁');
    } catch (err) {
        console.log(err);
    }
    process.exit();
};

// delete all data from collection
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('data successfully loaded...😁');
    } catch (err) {
        console.log(err);
    }
    process.exit();
};
// console.log(process.argv);
if (process.argv[2] === '--import') {
    // cmd :  node data/import-dev-data.js --import
    importData();
} else if (process.argv[2] === '--delete') {
    // cmd : node data/import-dev-data.js --delete
    deleteData();
}
