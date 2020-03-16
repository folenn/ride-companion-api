import path from 'path';
import express, { Response, Request, NextFunction } from 'express';
import Controller from '../../interfaces/controller.interface';
import validationMiddleware from '../../middleware/validation.middleware';
import { UserModel } from './user.model';
import { UserService } from './user.service';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';
import { UserDetailsDto } from './user.dto';
import { WrongFileFormatException } from '../../exceptions/wrong-file-format.exception';
import multer, { StorageEngine, Instance } from 'multer';
import { NoFileProvidedException } from '../../exceptions/no-file-provided.exception';
import { file } from 'babel-types';
import { DriverModel } from '../driver/driver.model';

export class UserController implements Controller {
  public path = '/users';
  public router = express.Router();
  private userModel = UserModel;
  private driverModel = DriverModel;
  private userSvc = new UserService();
  private storage: StorageEngine;
  private upload: Instance;

  constructor() {
    this.initializeMulter();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/me`,
      authenticationMiddleware,
      this.getUserProfile
    );
    this.router.post(`${this.path}/me`,
      authenticationMiddleware,
      validationMiddleware(UserDetailsDto),
      this.updatingUser);
    this.router.post(`${this.path}/upload-avatar`,
      authenticationMiddleware,
      this.upload.single('avatar'),
      this.uploadingAvatar);
  }

  private initializeMulter() {
    this.storage = multer.diskStorage({
      destination: path.resolve(__dirname, '../../public/avatars'),
      filename: (request: Request, file: Express.Multer.File, callback) => {
        callback(null, `${request.user._id}-${file.originalname}`.replace(/\s/g, ''));
      }
    });
    this.upload = multer({
      storage: this.storage,
      limits: {
        fileSize: 1000000
      },
      fileFilter(request: Request, file: Express.Multer.File, callback: (error: (Error | null), acceptFile?: boolean) => void): void {
        console.log(file);
        if (file.originalname.match(/\.(jpeg|jpg|png)$/i)) {
          return callback(null, true);
        }
        return callback(new WrongFileFormatException());
      }
    });
  }

  private getUserProfile = async (request: Request, response: Response, next: NextFunction) => {
    try {
      return response.status(200).send(await request.user.getPublicProfile());
    } catch (e) {
      next(e);
    }
  }

  private updatingUser = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const userData = request.body;
      const isModified = await this.userSvc.updateUserProfile(request.user._id, userData);
      if (isModified) {
        response.status(200).send({
          message: 'User successfully updated'
        })
      }
    } catch (e) {
      next(e)
    }
  };

  private uploadingAvatar = async (request: Request, response: Response, next: NextFunction) => {
    try {
      console.log(request.body);
      const { file: { filename } = {filename: ''} } = request;
      if (!filename) throw new NoFileProvidedException();

      const { user: { _id } } = request;
      const imageUrl = await this.userSvc.updateUserAvatar(_id, filename);
      response.send({
        message: 'Avatar successfully uploaded',
        imageUrl
      });
    } catch (e) {
      console.log(e);
      next(e)
    }
  };
}

