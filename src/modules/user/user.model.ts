import { Document, model, Schema } from 'mongoose';
import jwt from 'jsonwebtoken';
import { isEmail, isMobilePhone, isNumeric } from 'validator';
import { IUser } from './user.interface';
import { SessionModel } from '../session/session.model';
import { DriverModel } from '../driver/driver.model';
import bcrypt = require('bcrypt');

const userSchema: Schema = new Schema({
  email: {
    type: String,
    required: function () {
      return !(this as any).phone.number;
    },
    lowercase: true,
    unique: true,
    trim: true,
    sparse: true,
    validate: (value: string) => isEmail(value) || isNumeric(value)
  },
  phone: {
    number: {
      type: String,
      required: function () {
        return !(this as any).email;
      },
      lowercase: true,
      unique: true,
      sparse: true,
      trim: true,
      validate: (value: string) => isMobilePhone(value, 'uk-UA')
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  password: String,
  verified: {
    type: String,
    default: false
  },
  firstLogin: {
    type: Boolean,
    default: true
  },
  social: {
    facebookConnected: {
      type: Boolean,
      default: false
    },
    googleConnected: {
      type: Boolean,
      default: false
    },
    facebookId: String,
    googleId: String
  },
  details: {
    imageUrl: String,
    name: String
  },
  rating: {
    type: Number,
    default: 5,
    max: 5,
    min: 0
  },
  trust: {
    type: Number,
    default: 0
  },
  driverProfile: {
    type: Schema.Types.ObjectId,
    ref: 'Driver'
  }
});

userSchema.methods.getPublicProfile = async function () {
  let user = this;
  user = await user.populate('driverProfile').execPopulate();
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.verified;

  return userObject;
};

userSchema.methods.generateAuthTokens = async function () {
  try {
    const accessToken = await jwt.sign({user: this._id.toString()}, process.env.JWT_SECRET || '', {
      expiresIn: '2h'
    }).toString();

    const refreshToken = await jwt.sign({user: this._id.toString()}, process.env.JWT_REFRESH_SECRET || '', {
      expiresIn: '30d'
    }).toString();

    await SessionModel.create({
      accessToken,
      refreshToken,
      user: this._id
    });
    return {accessToken, refreshToken};
  } catch (e) {
    throw e;
  }
};

userSchema.methods.logOut = async function (token: string) {
  try {
    return await SessionModel.deleteOne({accessToken: token});
  } catch (e) {
    throw e;
  }
};


userSchema.pre<IUser>('save', async function (next) {
  const user = this;
  if (user.isNew && !user.isModified('password')) {
    const driverProfile = await DriverModel.create({
      user: user.id
    })
    user.driverProfile = driverProfile.id;
    return next();
  }
  if (!user.isModified('password')) return next();
  bcrypt.genSalt(8, (err, salt) => {
    if (err) return next(err);

    // hash the password using our new salt
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) return next(err);

      // override the cleartext password with the hashed one
      user.password = hash;
      next();
    });
  });
});
export const UserModel = model<IUser & Document>('User', userSchema);
