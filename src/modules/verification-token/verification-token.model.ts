import { model, Schema } from 'mongoose';
import { IVerificationToken } from './verification-token.interface';

const verificationTokenSchema = new Schema({
  token: {
    type: String,
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    required: true,
    expires: 43200
  }
});

export const VerificationTokenModel = model<IVerificationToken & Document>('verification-token', verificationTokenSchema);
