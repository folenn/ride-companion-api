import request from 'supertest';
import faker from 'faker';
import App from '../../../app';
import AuthenticationController from '../authentication.controller';
import { UserModel } from '../../user/user.model';
import { SessionModel } from '../../session/session.model';
import { VerificationTokenModel } from '../../verification-token/verification-token.model';
import { PasswordResetModel } from '../../reset-token/reset-token.model';

const jwtSecret = process.env.JWT_SECRET;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

const authenticationController = new AuthenticationController();
const app = new App([
  authenticationController
]);

jest.setTimeout(10000);

afterAll(async () => {
  await Promise.all([
    UserModel.deleteMany({}).exec(),
    VerificationTokenModel.deleteMany({}).exec(),
    SessionModel.deleteMany({}).exec(),
    PasswordResetModel.deleteMany({}).exec()
  ]);
});

describe('AuthenticationController', () => {
  const userData = {
    email: faker.internet.email(),
    password: faker.internet.password(5)
  };

  describe('POST /auth/register', () => {
    describe('if user email is not taken', () => {
      it('should return success response with accessToken and refreshToken', async () => {
        authenticationController.authenticationService.mailingSvc.sendEmailVerification = jest.fn().mockReturnValue(Promise.resolve(undefined));

        const response = await request(app.getServer())
          .post(`${authenticationController.path}/register`)
          .send(userData)
          .expect(201);

        const createdUser = await UserModel.findOne({email: userData.email});
        expect(createdUser).not.toBeNull();

        const session = await SessionModel.findOne({user: createdUser._id});
        expect(session).not.toBeNull();

        const verificationToken = await VerificationTokenModel.findOne({user: createdUser._id});
        expect(verificationToken).not.toBeNull();

        expect(response.body).toMatchObject({
          message: 'User successfully created',
          accessToken: session.accessToken,
          refreshToken: session.refreshToken
        });
      });
    });

    describe('if user email already taken', () => {
      it('should return error status and message that user already taken', async () => {
        const response = await request(app.getServer())
          .post(`${authenticationController.path}/register`)
          .send(userData)
          .expect(400);

        expect(response.body).toMatchObject({
          message: `User with email ${userData.email} already exists`
        });
      });
    });

    describe('if input data is wrong or not provided', () => {
      it('should return message that email is wrong', async () => {
        const response = await request(app.getServer())
          .post(`${authenticationController.path}/register`)
          .send({...userData, email: faker.random.word()})
          .expect(400);

        expect(response.body).toMatchObject({
          message: 'email must be an email'
        });
      });

      it('should return error message if password not provided', async () => {
        const response = await request(app.getServer())
          .post(`${authenticationController.path}/register`)
          .send({...userData, password: ''})
          .expect(400);

        expect(response.body).toMatchObject({
          message: 'password must be longer than or equal to 5 characters'
        });
      });
    });
  });

  describe('POST /auth/login', () => {
    describe('if user exist', () => {
      it('should return success response with accessToken and refreshToken', async () => {
        const response = await request(app.getServer())
          .post(`${authenticationController.path}/login`)
          .send(userData)
          .expect(200);

        const session = await SessionModel.findOne({
          accessToken: response.body.accessToken,
          refreshToken: response.body.refreshToken
        });
        expect(session).not.toBeNull();

        expect(response.body).toMatchObject({
          message: 'Login success',
          accessToken: session.accessToken,
          refreshToken: session.refreshToken
        });
      });
    });

    describe('if user not exist', () => {
      it('should return error response if user not exist', async () => {
        const generatedEmail = faker.internet.email();
        const response = await request(app.getServer())
          .post(`${authenticationController.path}/login`)
          .send({...userData, email: generatedEmail})
          .expect(404);

        expect(response.body).toMatchObject({
          message: `User with email ${generatedEmail} was not found`
        });
      });
    });

    describe('if input data is wrong', () => {
      it('should return error when email is wrong', async () => {
        const response = await request(app.getServer())
          .post(`${authenticationController.path}/login`)
          .send({...userData, email: faker.random.word()})
          .expect(400);

        expect(response.body).toMatchObject({
          message: `email must be an email`
        });
      });

      it('should return error when password not provided', async () => {
        const response = await request(app.getServer())
          .post(`${authenticationController.path}/login`)
          .send({...userData, password: ''})
          .expect(400);

        expect(response.body).toMatchObject({
          message: `Password is wrong`
        });
      });
    });
  });

  describe('POST /auth/logout', () => {
    describe('if auth token is valid', () => {
      it('should return message that user is logged out', async () => {
        const user = await UserModel.findOne({email: userData.email});
        expect(user).not.toBeNull();
        const session = await SessionModel.findOne({user: user._id});
        expect(session).not.toBeNull();

        const response = await request(app.getServer())
          .post(`${authenticationController.path}/logout`)
          .send()
          .set('Authorization', `Bearer ${session.accessToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          message: 'Successfully logged out'
        });
      });
    });
  });

  describe('POST /auth/resend-verification', () => {
    describe('if user with given email exist and it\'s not verified', () => {
      it('should resend email verification', async () => {
        const user = await UserModel.findOne({email: userData.email});
        expect(user).not.toBeNull();
        expect(user.verified).toBe('false');

        const response = await request(app.getServer())
          .post(`${authenticationController.path}/resend-verification`)
          .send({email: userData.email})
          .expect(200);
        expect(response.body).toMatchObject({
          message: `Email confirmation letter was sent to ${userData.email}`
        });
      });
    });
  });

  describe('GET /auth/verify', () => {
    describe('if user exist and verification token is valid', () => {
      it('should return message that user successfully verified', async () => {
        const user = await UserModel.findOne({email: userData.email});
        expect(user).not.toBeNull();

        const verificationToken = await VerificationTokenModel.findOne({user: user._id});
        expect(user).not.toBeNull();

        const response = await request(app.getServer())
          .get(`${authenticationController.path}/verify/${user._id}/${verificationToken.token}`)
          .send()
          .expect(200);
        expect(response.header['content-type']).toEqual('text/html; charset=utf-8');
      });
    });
  });

  describe('POST /auth/password-reset', () => {
    describe('if user with given email exist', () => {
      it('should create and send password reset token to given email', async () => {
        const user = await UserModel.findOne({email: userData.email});
        expect(user).not.toBeNull();

        authenticationController.authenticationService.mailingSvc.sendPasswordResetToken = jest.fn().mockReturnValue(Promise.resolve(undefined));

        const response = await request(app.getServer())
          .post(`${authenticationController.path}/password-reset`)
          .send({email: user.email})
          .expect(200);
        expect(response.body).toMatchObject({
          message: `Password resetting instructions was sent to ${user.email}`
        });
      });
    });
  });

  describe('POST /auth/password-reset/:userId/:token', () => {
    describe('if user exist and token not expired', () => {
      it('should return success message and change password in db', async () => {
        const user = await UserModel.findOne({email: userData.email});
        expect(user).not.toBeNull();

        const newPassword = faker.internet.password(5);

        const resetToken = await PasswordResetModel.findOne({user: user._id});
        expect(resetToken).not.toBeNull();

        const response = await request(app.getServer())
          .post(`${authenticationController.path}/password-reset/${user._id}/${resetToken.token}`)
          .send({
            password: userData.password,
            newPassword
          })
          .expect(200);

        expect(response.body).toMatchObject({
          message: 'Password successfully changed'
        });
        expect(await PasswordResetModel.findOne({user: user._id})).toBeNull();
      });
    });
  });
});
