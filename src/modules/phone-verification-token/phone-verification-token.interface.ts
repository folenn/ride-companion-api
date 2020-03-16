import { Document } from 'mongoose';
import { IUser } from '../user/user.interface';

export interface IPhoneVerificationToken extends Document {
    token: string;
    phone: string;
    user: IUser['_id'];
  }
