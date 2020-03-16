import { Document } from 'mongoose';
import { IUser } from '../user/user.interface';

export interface IResetToken extends Document {
  token: string;
  user: IUser['_id'] | IUser;
}
