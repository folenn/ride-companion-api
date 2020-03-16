import express, { NextFunction, Request, Response } from 'express';
import Controller from '../../interfaces/controller.interface';
import validationMiddleware from '../../middleware/validation.middleware';
import AuthenticationService from './authentication.service';
import { CreateUserByEmailDto, CreateUserByPhoneDto } from '../user/user.dto';
import { LoginWithEmailDto } from './loginWithEmail.dto';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';
import { AuthResetDto } from './authReset.dto';
import { ResetPasswordDto } from './reset-password.dto';
import { RefreshTokenDto } from './refresh-token.dto';
import { LoginWithPhoneDto } from './loginWithPhone.dto';
import { PhoneCodeDto } from './phoneCode.dto';
import LoginFailedException from '../../exceptions/login-failed.exception';

class AuthenticationController implements Controller {
  public path = '/auth';
  public router = express.Router();
  public authenticationService = new AuthenticationService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/register`, validationMiddleware(CreateUserByEmailDto), this.registration);
    this.router.post(`${this.path}/login`, validationMiddleware(LoginWithEmailDto), this.loggingIn);
    this.router.post(`${this.path}/login-by-phone`, validationMiddleware(LoginWithPhoneDto), this.loggingInByPhone);
    this.router.post(`${this.path}/logout`, authenticationMiddleware, this.loggingOut);
    this.router.post(`${this.path}/refresh`, validationMiddleware(RefreshTokenDto), this.refreshAuthToken);
    this.router.post(`${this.path}/verify-phone-code`, validationMiddleware(PhoneCodeDto), this.verifyPhoneCode);
    this.router.get(`${this.path}/verify/:userId/:token`, this.verifyEmail);
    this.router.post(`${this.path}/resend-verification`, validationMiddleware(AuthResetDto), this.resendEmailVerification);
    this.router.post(`${this.path}/password-reset`, validationMiddleware(AuthResetDto), this.sendPasswordResetToken);
    this.router.post(`${this.path}/password-reset/:userId/:token`, validationMiddleware(ResetPasswordDto), this.resettingPassword);
    this.router.post(`${this.path}/social-login`, this.socialLogin)
  }

  private registration = async (request: Request, response: Response, next: NextFunction) => {
    const userData: CreateUserByEmailDto = request.body;
    try {
      const {
        accessToken,
        refreshToken
      } = await this.authenticationService.register(userData);
      response.status(201).send({
        message: 'User successfully created',
        accessToken,
        refreshToken
      });
    } catch (error) {
      next(error);
    }
  };

  private loggingIn = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const logInData: LoginWithEmailDto = request.body;
      const { accessToken, refreshToken } = await this.authenticationService.login(logInData);
      return response.status(200).send({
        message: 'Login success',
        accessToken,
        refreshToken
      })
    } catch (e) {
      next(e);
    }
  };

  private loggingInByPhone = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const logInData: LoginWithPhoneDto = request.body;
      const codeSent = await this.authenticationService.loginByPhone(logInData);
      if (codeSent) {
        return response.status(200).send({
          message: 'Verification token sent to phone number'
        })
      } else {
        return response.status(400).send({
          message: 'Something went wrong'
        });
      }
    } catch (e) {
      next(e);
    }
  };

  private verifyPhoneCode = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const verifyData: PhoneCodeDto = request.body;
      const {accessToken, refreshToken} = await this.authenticationService.verifyPhoneCode(verifyData);
      if (!(accessToken && refreshToken)) {
        return response.status(400).send({
          message: 'Something went wrong'
        })
      }
      return response.status(200).send({
        message: 'Login successful',
        accessToken,
        refreshToken
      })
    } catch (e) {
      next(e);
    }
  };


  private loggingOut = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { user, token } = request;
      await this.authenticationService.logout(user, token);
      response.status(200).send({
        message: 'Successfully logged out'
      });
    } catch (e) {
      next(e);
    }
  };

  sendPasswordResetToken = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const {email} = request.body;
      await this.authenticationService.sendPasswordResetToken(email);
      response.send({
        message: `Password resetting instructions was sent to ${email}`
      });
    } catch (e) {
      next(e);
    }
  };

  private refreshAuthToken = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { refreshToken } = request.body;
      const { accessToken, refreshToken: newRefreshToken } = await this.authenticationService.refreshToken(refreshToken);
      response.status(200).send({
        accessToken,
        refreshToken: newRefreshToken,
        message: 'Refresh successfull'
      });
    } catch (e) {
      next(e);
    }
  };

  resendEmailVerification = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { email } = request.body;
      await this.authenticationService.resendVerificationToken(email);
      response.status(200).send({
        message: `Email confirmation letter was sent to ${email}`
      })
    } catch(e) {
      next(e);
    }
  };

  resettingPassword = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { userId, token } = request.params;
      const { password, newPassword } = request.body;
      await this.authenticationService.resetPassword(userId, token, {password, newPassword});
      response.send({
        message: 'Password successfully changed'
      })
    } catch (e) {
      next(e);
    }
  };

  private verifyEmail = async (request: Request, response: Response) => {
    try {
      const {userId, token} = request.params;
      if (!userId || !token) {
        response.render('email-verification', {
          message: 'Provide a verification token, please'
        });
      }
      await this.authenticationService.verifyEmail(userId, token);
      response.render('email-verification', {
        message: 'User succesfully verified'
      });
    } catch (e) {
      response.render('email-verification', {
        message: 'Error ' + e
      });
    }
  };

  private socialLogin = async (request: Request, response: Response) => {
    try {
        const tokenSource = request.get('Token-Source');
        const token = request.body.accessToken;
        let authResult: {accessToken: string, refreshToken: string} | undefined;

        switch (tokenSource) {
            case 'facebook': {
                authResult = await this.authenticationService.loginWithFacebook(token);
                break;
            }
            case 'google': {
                authResult = await this.authenticationService.loginWithGoogle(token);
                break;
            }
            default:
                break;
        }
        if (!authResult) {
          throw new LoginFailedException();
        }
        
        const { accessToken, refreshToken } = authResult;

        response.status(200).send({
            accessToken,
            refreshToken,
        });
    } catch(e) {
        response.status(400).send({
            name: 'Error',
            details: 'Something went wrong during login' + e,
            status: 400
        })
    }
  }
}

export default AuthenticationController;
