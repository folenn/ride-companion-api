import { Document, model, Schema } from 'mongoose';
import { IDriver } from './driver.interface';
import { DriverService } from './driver.service';
import { API_OPENBOT_CAR_INFO } from '../../constants/api.constants';

const driverSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  car: {
    name: String,
    verifiedName: String,
    verified: {
      type: Boolean,
      default: false
    },
    imageUrl: String,
    number: String,
    owner: String
  },
  trust: {
    type: Number,
    default: 0
  },
  filled: {
    type: Boolean,
    default: false
  }
});

// driverSchema.pre<IDriver>('save', async function (next) {
//   const driver = this;
//   if (!driver.isModified('car.number')) return next();

//   const {model, color, kind} = await DriverService.verifyCarModel(driver.car.number, API_OPENBOT_CAR_INFO);
//   driver.car.verifiedName = `${model}, ${color.toLowerCase()}, ${kind.toLowerCase()}`;
//   next();
// });

export const DriverModel = model<IDriver & Document>('Driver', driverSchema);

