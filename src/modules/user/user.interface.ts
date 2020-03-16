import { Document } from 'mongoose';
import { IDriver } from '../driver/driver.interface';

export interface IUser extends Document {
  email: string;
  password: string;
  phone: string;
  verified: boolean;
  details: IUserDetails;
  driverProfile: string | IDriver;

  //methods
  generateAuthTokens(): {accessToken: string, refreshToken: string};
  getPublicProfile(): {};
  logOut(token: string): void;
}

export interface IUserDetails {
  firstName: string;
  lastName: string;
  imageUrl: string;
  phone: string;
  rating?: number;
  trust?: number;
}
