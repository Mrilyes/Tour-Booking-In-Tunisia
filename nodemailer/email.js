const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 3 steps in order to send emails with nodemailer
    // 1) create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
    // 2) define the email options
    const mailOptions = {
        from: 'Ilyes Gh <tourbooking@gmail.com>',
        to: options.email,
        subject: options.subject,
        html: options.message,
    };
    // 3) send the email with nodemailer
    await transporter.sendMail(mailOptions);
};
module.exports = sendEmail;
