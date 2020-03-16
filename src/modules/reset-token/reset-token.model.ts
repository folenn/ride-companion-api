import { model, Schema } from 'mongoose';
import { IResetToken } from './reset-token.interface';

const passwordResetSchema = new Schema({
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

export const PasswordResetModel = model<IResetToken & Document>('reset-token', passwordResetSchema);
