// nodemailer is a module that makes it easy to send emails from nodejs applications
// we need to install it using npm i nodemailer.

const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) create a transporter
  // transporter is the service that will send the email
  // we can use any email service provider like gmail, yahoo, outlook etc
  // it is not node js that sends the email but the email service provider
  const transporter = nodemailer.createTransport({
    // service: 'Gmail',
    host: process.env.EMAIL_HOST, // we can use any email service provider like gmail, yahoo, outlook etc
    port: process.env.EMAIL_PORT, // 587 is the port for secure email
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // activate in gmail "less secure app" option
  });

  // Looking to send emails in production? Check out our Email API/SMTP product!
  // const transport = nodemailer.createTransport({
  //   host: 'sandbox.smtp.mailtrap.io',
  //   port: 2525,
  //   auth: {
  //     user: '423b70d5b17f24',
  //     pass: 'e9a75ec3e22289',
  //   },
  // });

  // 2) Define the email options

  const mailOptions = {
    from: 'Chigoziem <hellochigozie@example.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  // 3) Actually send the email

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Error sending email:', err);
    } else {
      console.log('Email sent:', info.messageId);
    }
  });
};

module.exports = sendEmail;
