import crypto = require('crypto');
import { VerificationTokenModel } from './verification-token.model';

class VerificationTokenService {
  public verification = VerificationTokenModel;

  public async generateVerificationToken(userId: string) {
    try {
      return await this.verification.create({
        token: crypto.randomBytes(16).toString('hex'),
        user: userId
      })
    } catch (e) {
      throw e;
    }
  }
}

export default VerificationTokenService;
