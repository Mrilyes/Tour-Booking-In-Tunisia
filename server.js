const mongoose = require('mongoose');

const dotenv = require('dotenv');

// process.on('uncaughtException', (err) => {
//     console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
//     console.log(err.name, err.message);
//     process.exit(1);
// });

dotenv.config({ path: './config.env' });

const app = require(`${__dirname}/app`);

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
        autoIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('DB connection successful...');
    })
    .catch((err) => {
        console.log('ERROR...');
    });

// console.log(process.env);

// to start up a server
const port = process.env.PORT;
app.listen(port, () => {
    console.log(`app running on port ${port}...`);
});
