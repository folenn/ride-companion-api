import bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import { UserModel } from '../user/user.model';
import { CreateUserByEmailDto, CreateUserByPhoneDto } from '../user/user.dto';
import UserWithThatEmailAlreadyExistsException from '../../exceptions/user-with-that-email-already-exist.exception';
import MailingService from '../mailing/mailing.service';
import VerificationTokenService from '../verification-token/verification-token.service';
import { LoginWithEmailDto } from './loginWithEmail.dto';
import UserNotFoundException from '../../exceptions/user-not-found.exception';
import PasswordDontMatchException from '../../exceptions/password-dont-match.exception';
import { UserAlreadyVerifiedException } from '../../exceptions/user-already-verified.exception';
import { VerificationTokenModel } from '../verification-token/verification-token.model';
import TokenExpiredException from '../../exceptions/token-expired.exception';
import { IUser } from '../user/user.interface';
import PasswordResetService from '../reset-token/reset-token.service';
import { PasswordResetModel } from '../reset-token/reset-token.model';
import { ResetPasswordDto } from './reset-password.dto';
import { JwtDecodedUser } from '../../middleware/authentication.middleware';
import { SessionModel } from '../session/session.model';
import UserWithThatPhonelAlreadyExistsException from '../../exceptions/user-with-that-phone-already-exist.exception';
import PhoneVerificationTokenService from '../phone-verification-token/phone-verification-token.service';
import { LoginWithPhoneDto } from './loginWithPhone.dto';
import { PhoneCodeDto } from './phoneCode.dto';
import { PhoneVerificationTokenModel } from '../phone-verification-token/phone-verification-token.model';
import { OAuth2Client } from 'google-auth-library';
import FB from 'fb';
import LoginFailedException from '../../exceptions/login-failed.exception';

const client = new OAuth2Client();
const clientId = process.env.GOOGLE_CLIENT_ID;
const facebookClientId = process.env.FACEBOOK_CLIENT_ID;
const facebookClientSecret = process.env.FACEBOOK_CLIENT_SECRET;

class AuthenticationService {
  public user = UserModel;
  public session = SessionModel;
  public verificationToken = VerificationTokenModel;
  public phoneVerificationToken = PhoneVerificationTokenModel;
  public passwordResetModel = PasswordResetModel;
  public mailingSvc = MailingService;
  public verificationTokenSvc = new VerificationTokenService();
  public passwordResetTokenSvc = new PasswordResetService();
  public phoneVerificationTokenSvc = new PhoneVerificationTokenService();

  public async register(userData: CreateUserByEmailDto) {
    try {
      if (await this.user.findOne({email: userData.email})) {
        throw new UserWithThatEmailAlreadyExistsException(userData.email);
      }
      const user = await this.user.create(userData);
      const { token } = await this.verificationTokenSvc.generateVerificationToken(user._id);
      const [_, tokens] = await Promise.all([this.mailingSvc.sendEmailVerification(user.email, token, user._id), user.generateAuthTokens()]);
      return tokens;
    } catch(e) {
      throw e;
    }
  }

  public async registerByPhone(userData: CreateUserByPhoneDto) {
    try {
      const foundUser = await this.user.findOne({'phone.number': userData.phone});
      if (foundUser)
        throw new UserWithThatPhonelAlreadyExistsException(userData.phone);
      const user = await this.user.create({
        phone: {
          number: userData.phone
        }
      });
      await this.phoneVerificationTokenSvc.generatePhoneVerificationToken(userData.phone, user.id);
      return await user.generateAuthTokens();
    } catch (e) {
      throw e;
    }
  }

  public async login({email, password}: LoginWithEmailDto) {
    try {
      const foundUser = await this.user.findOne({email});
      if (!foundUser) throw new UserNotFoundException(email);

      const isMatch = await bcrypt.compare(password, foundUser.password);
      if (!isMatch) throw new PasswordDontMatchException();

      return await (foundUser as any).generateAuthTokens();
    } catch (e) {
      throw e;
    }
  }

  public async loginByPhone(loginData: LoginWithPhoneDto) {
    try {
      return await this.phoneVerificationTokenSvc.generatePhoneVerificationToken(loginData.phone);
    } catch (e) {
      throw e;
    }
  }

  public async verifyPhoneCode(verifyData: PhoneCodeDto) {
    try {
      const token = await this.phoneVerificationToken.findOne({token: verifyData.code});
      if (!token)
        throw new TokenExpiredException();
      const user = await this.user.findOne({'phone.number': token.phone});

      if (!user) {
        const createdUser = await this.user.create({
          phone: {
            number: token.phone,
            verified: true
          }
        });
        const [_, tokens] = await Promise.all([
          this.phoneVerificationToken.deleteMany({phone: token.phone}),
          createdUser.generateAuthTokens()
        ]);
        return tokens;
      } else {
        return await user.generateAuthTokens();
      }

    } catch (e) {
      throw e;
    }
  }

  public async refreshToken(refreshToken: string) {
    try {
      const { user: userId } = await jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET) as JwtDecodedUser;
      if (!userId) throw new TokenExpiredException();
      const [foundUser, foundToken] = await Promise.all([
        this.user.findById(userId),
        this.session.findOne({refreshToken})
      ]);
      if (!foundUser) throw new UserNotFoundException();
      if (!foundToken) throw new TokenExpiredException();

      const [_, newTokens] = await Promise.all([
        foundToken.remove(),
        foundUser.generateAuthTokens()
      ]);
      return newTokens;
    } catch (e) {
      throw e;
    }
  }

  public async logout(user: IUser, token: string) {
    try {
      await user.logOut(token);
    } catch (e) {
      throw e;
    }
  }

  public async verifyEmail(userId: string, token: string) {
    try {
      const [user, verificationToken] = await Promise.all([
        await this.user.findById(userId),
        await this.verificationToken.findOne({token})
      ]);
      if (!user) throw new UserNotFoundException();
      if ((user.verified as any) === 'true') throw new UserAlreadyVerifiedException();
      if (!verificationToken) throw new TokenExpiredException();

      user.verified = true;
      return await Promise.all([user.save(), verificationToken.remove()]);
    } catch (e) {
      throw e;
    }
  }

  public async resendVerificationToken(email: string) {
    try {
      const user = await this.user.findOne({email});
      if (!user) throw new UserNotFoundException(email);
      if ((user.verified as any) === 'true') throw new UserAlreadyVerifiedException();

      await this.verificationToken.deleteMany({user: user._id});

      const { token } = await this.verificationTokenSvc.generateVerificationToken(user._id);
      return await this.mailingSvc.sendEmailVerification(user.email, token, user._id);
    } catch (e) {
      throw e;
    }
  };

  public async sendPasswordResetToken(email: string) {
    try {
      const foundUser = await this.user.findOne({email});
      if (!foundUser) throw new UserNotFoundException(email);
      const [_, resetToken] = await Promise.all([
        this.passwordResetModel.deleteMany({user: foundUser._id}),
        this.passwordResetTokenSvc.generatePasswordResetToken(foundUser._id)
      ]);
      return await MailingService.sendPasswordResetToken(email, resetToken.token, foundUser._id);
    } catch (e) {
      throw e;
    }
  };

  public async resetPassword(userId: string, token: string, resetData: ResetPasswordDto) {
    try {
      const isObjectIdValid = Types.ObjectId.isValid(userId);
      if (!isObjectIdValid) throw new UserNotFoundException();

      const foundToken = await this.passwordResetModel.findOne({token});
      if (!foundToken) throw new TokenExpiredException();

      const foundUser = await this.user.findOne({_id: userId});
      if (!foundUser) throw new UserNotFoundException();

      const isMatch = await bcrypt.compare(resetData.password, foundUser.password);
      if (!isMatch) throw new PasswordDontMatchException();

      foundUser.password = resetData.newPassword;
      return Promise.all([foundUser.save(), this.passwordResetModel.deleteMany({user: userId})]);
    } catch (e) {
      throw e;
    }
  }

  async loginWithGoogle(token: string) {
        try {
            const googlePayload = await this.verifyGoogleToken(token);
            if (googlePayload && googlePayload.email) {
    
                let currentUser = await this.user.findOne({email: googlePayload.email});
    
                if (!currentUser) {
                    currentUser = await this.user.create({
                        email: googlePayload.email,
                        verified: googlePayload.email_verified,
                        details: {
                          name: `${googlePayload.name || ''}`,
                          imageUrl: googlePayload.picture
                        },
                        social: {
                          googleConnected: true,
                          googleId: googlePayload.sub
                        }
                    });
                }
                if (!currentUser.details.imageUrl) {
                  currentUser.details.imageUrl = googlePayload.picture;
                  await currentUser.save();
                }
                return currentUser.generateAuthTokens();
            } else {
              throw new LoginFailedException();
            }
        } catch (e) {          
            throw e;
        }
    }

    async verifyGoogleToken(token: string) {
      try {
          const ticket = await client.verifyIdToken({
              idToken: token,
              audience: clientId as string
          });
          return ticket.getPayload();
      } catch(e) {
          throw e;
      }
  }

  async loginWithFacebook(token: string) {
            try {
                // @ts-ignore
                const accessTokenResponse = await FB.api('oauth/access_token?client_id=' + facebookClientId + '&client_secret=' + facebookClientSecret + '&grant_type=client_credentials');
                // @ts-ignore
                const isTokenValid = await FB.api('debug_token?input_token=' + token + '&access_token=' + accessTokenResponse.access_token);
    
                // @ts-ignore
                const fbUser = await FB.api('me?fields=email,first_name,last_name,picture&access_token=' + token);
    
                let currentUser = await this.user.findOne({email: fbUser.email || fbUser.id});
                if (!currentUser) {
                    currentUser = await this.user.create({
                        email: fbUser.email || fbUser.id,
                        details: {
                          name: `${fbUser.last_name || ''} ${fbUser.first_name || ''}`,
                          imageUrl: `https://graph.facebook.com/${fbUser.id}/picture?height=250&width=250`
                        },
                        verified: true,
                        social: {
                          facebookConnected: true,
                          facebookId: fbUser.id
                        }
                    });
                }
    
                return currentUser.generateAuthTokens();
            } catch(e) {
                throw e;
            }
        }
}

export default AuthenticationService;
