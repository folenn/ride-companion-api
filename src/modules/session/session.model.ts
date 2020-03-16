import { Schema, model, Document } from 'mongoose';
import { ISession } from './session.interface';

const sessionSchema = new Schema({
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    required: true,
    expires: 2592000
  }
});

export const SessionModel = model<ISession & Document>('session', sessionSchema);
