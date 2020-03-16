import { model, Schema } from 'mongoose';
import { IPhoneVerificationToken } from './phone-verification-token.interface';

const phoneVerificationTokenSchema = new Schema({
  token: {
    type: Number,
    required: true
  },
  phone: {
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
    expires: 300
  }
});

export const PhoneVerificationTokenModel = model<IPhoneVerificationToken & Document>('phone-verification-token', phoneVerificationTokenSchema);
