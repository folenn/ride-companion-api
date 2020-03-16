import axios from 'axios';
import { PhoneVerificationTokenModel } from './phone-verification-token.model';
import { MessagesLimitExceededException } from '../../exceptions/messages-limit-exceeded.exception';

class PhoneVerificationTokenService {
  public phoneVerification = PhoneVerificationTokenModel;

  public async generatePhoneVerificationToken(phone: string, userId?: string) {
    try {
      const count = await this.phoneVerification.find({phone}).count();
      if (count >= 5)
        throw new MessagesLimitExceededException();
      const {token = null} = await this.phoneVerification.create({
        token: Math.floor(100000 + Math.random() * 900000),
        phone,
        user: userId
      });
      if (token && phone) {
          return await this.sendSmsToNumber(phone, token);
      }
    } catch (e) {
      throw e;
    }
  }

  public async sendSmsToNumber(phoneNumber: string, token: any) {
    try {
      // await axios.post('https://im.smsclub.mobi/sms/send', {
      //       "phone": [`"${phoneNumber}"`],
      //       "src_addr": 'VashZakaz',
      //       "message": `Ваш код підтвердження: ${token}`
      //   }, {
      //     headers: {
      //       'Authorization': `Bearer ${process.env.SMSCLUB_TOKEN}`
      //     }
      //   });
        return true;
    } catch (e) {
        throw e;
    }
  }
}

export default PhoneVerificationTokenService;
