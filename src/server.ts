import 'dotenv/config';
import App from './app';
import validateEnv from './utils/validateEnv';
import AuthenticationController from './modules/authentication/authentication.controller';
import { UserController } from './modules/user/user.controller';
import { DriverController } from './modules/driver/driver.controller';
import { RideController } from './modules/ride/ride.controller';

validateEnv();

const app = new App(
  [
    new AuthenticationController(),
    new DriverController(),
    new UserController(),
    new RideController()
  ],
);

app.listen();
