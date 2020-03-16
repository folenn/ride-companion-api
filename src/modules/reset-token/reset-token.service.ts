import crypto = require('crypto');
import { PasswordResetModel } from './reset-token.model';

class PasswordResetService {
  public resetPasswordToken = PasswordResetModel;

  public async generatePasswordResetToken(userId: string) {
    try {
      return await this.resetPasswordToken.create({
        token: crypto.randomBytes(16).toString('hex'),
        user: userId
      })
    } catch (e) {
      throw e;
    }
  }
}

export default PasswordResetService;
