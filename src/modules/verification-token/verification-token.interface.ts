import { Document } from 'mongoose';
import { IUser } from '../user/user.interface';

export interface IVerificationToken extends Document {
  token: string;
  user: IUser['_id'];
}
