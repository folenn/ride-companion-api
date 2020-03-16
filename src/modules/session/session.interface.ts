import { Document } from 'mongoose';
import { IUser } from '../user/user.interface';

export interface ISession extends Document {
  accessToken: string;
  refreshToken: string;
  user: IUser['_id'];
}
