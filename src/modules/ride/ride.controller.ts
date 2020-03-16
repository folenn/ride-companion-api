import { authenticationMiddleware } from "../../middleware/authentication.middleware";
import Controller from "../../interfaces/controller.interface";
import express, { NextFunction, Request, Response } from 'express';
import validationMiddleware from "../../middleware/validation.middleware";
import { RideService } from "./ride.service";
import { RideDto } from "./ride.dto";
import { FindRideDto } from './find-ride.dto'

export class RideController implements Controller {
    public path = '/rides';
    public router = express.Router();
    private rideService = new RideService();

    constructor() {
      this.initializeRoutes();
    }

    private initializeRoutes() {
      this.router.get(`${this.path}`, authenticationMiddleware, validationMiddleware(FindRideDto), this.findingRide);
      this.router.post(`${this.path}`, authenticationMiddleware, validationMiddleware(RideDto), this.creatingRide);
    };

    private creatingRide = async (request: Request, response: Response, next: NextFunction) => {
      try {
        const {_id} = request.user;
        const rideData = request.body;
        await this.rideService.createRide(_id, rideData);
        response.status(200).send({
          message: 'Ride successfully created'
        });
      } catch (e) {
        next(e);
      }
    };

    private findingRide = async (request: Request, response: Response, next: NextFunction) => {
      try {
        const rideData = request.query;
        const foundRides = await this.rideService.findRide(rideData);
        response.status(200).send({
          rides: foundRides
        });
      } catch (e) {
        next(e);
      }
    };
  }
