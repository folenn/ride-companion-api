import { Document } from 'mongoose';
import { IUser } from '../user/user.interface';

export interface IDriver extends Document {
  user: string | IUser
  car: ICar;
  trust: number;

  //methods
}

export interface ICar {
  name: string;
  verifiedName: string;
  verified: boolean;
  imageUrl: string;
  number: string;
  owner: string;
}
