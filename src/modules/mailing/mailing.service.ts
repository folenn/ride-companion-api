const sgTransport = require('nodemailer-sendgrid-transport');
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport(sgTransport({
  auth: {
    api_user: process.env.SENDGRID_USER,
    api_key: process.env.SENDGRID_PASSWORD
  }
}));

class MailingService {
  public static async sendEmailVerification(email: string, token: string, userId: string) {
    try {
      const mailOptions = {
        from: 'fellowapp2019@gmail.com',
        to: email,
        subject: 'Account Verification Token',
        text: `Verify you account by clicking <a href="http://localhost:3000/verify/${userId}/${token}">this link</a>`
      };
      await transporter.sendMail(mailOptions);
    } catch (e) {
      throw e;
    }
  };

  public static async sendPasswordResetToken(email: string, token: string, userId: string) {
    try {
      const mailOptions = {
        from: 'fellowapp2019@gmail.com',
        to: email,
        subject: 'Password Reset Instructions',
        text: `Change your password by visiting <a href="http://localhost:3000/password-reset/${userId}/${token}">this link</a>`
      };
      await transporter.sendMail(mailOptions);
    } catch (e) {

    }
  }
}

export default MailingService;
