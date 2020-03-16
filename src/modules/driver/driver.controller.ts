import Controller from '../../interfaces/controller.interface';
import express, { NextFunction, Request, Response } from 'express';
import { DriverService } from './driver.service';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';
import validationMiddleware from '../../middleware/validation.middleware';
import { CarDto } from './car.dto';

export class DriverController implements Controller {
  public path = '/driver';
  public router = express.Router();
  private driverSvc = new DriverService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, authenticationMiddleware, validationMiddleware(CarDto), this.updatingDriverProfile);
  };

  private updatingDriverProfile = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const {_id} = request.user;
      const carData = request.body;
      await this.driverSvc.updateDriverProfile(_id, carData);
      response.status(200).send({
        message: 'Driver profile successfully updated'
      });
    } catch (e) {
      next(e);
    }
  };
}
