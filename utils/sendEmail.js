const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOpts = {
      from: 'Hotel Plus <Hotel_support@gmail.com>',
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    const info = await transporter.sendMail(mailOpts);
    console.log('✅ Email sent successfully:', info.response);
  } catch (err) {
    console.error('❌ EMAIL ERROR:', err);
    throw err; // علشان يطلع الخطأ الحقيقي في الـ stack
  }
};

module.exports = sendEmail;
