import axios from 'axios';
import { UserModel } from '../user/user.model';
import { DriverModel } from './driver.model';
import UserNotFoundException from '../../exceptions/user-not-found.exception';
import { DriverNotFoundException } from '../../exceptions/driver-not-found.exception';
import { CarDto } from './car.dto';
import { IDriver } from './driver.interface';
import { IUser } from '../user/user.interface';
import { IOpenbotCarData, IOpenbotIds } from './openbot.interface';
import { IAxiosResponse } from '../../interfaces/axios-response.interface';

export class DriverService {
  public userModel = UserModel;
  public driverModel = DriverModel;

  public static async verifyCarModel(number: string, link: string): Promise<IOpenbotCarData> {
    try {
      // Axios.get(`https://baza-gai.com.ua/nomer/${encodeURI('')}`)
      //   .then(data => {
      //     console.log(data.data);
      //     // const root = parse(data.data);
      //     // console.log((root as any).querySelectorAll('.car-title a')[0].childNodes[0].rawText);
      //   })
      const openbotResponse: IAxiosResponse<IOpenbotIds> = await axios.get(`${link}`, {
        params: {
          apiKey: process.env.OPENBOT_API_KEY,
          start: 0,
          limit: 1,
          number
        }
      });
      const {data} = openbotResponse.data;
      if (data.length) {
        const [entry] = data;
        const openbotCarData: IAxiosResponse<IOpenbotCarData> = await axios.get(`${link}/${entry.id}?apiKey=${process.env.OPENBOT_API_KEY}`);
        return openbotCarData.data ? openbotCarData.data : null;
      }
    } catch (e) {
      throw e;
    }
  }

  public async updateDriverProfile(userId: string, carData: CarDto) {
    try {
      const foundUser: IUser = await this.userModel.findById(userId);
      if (!foundUser) throw new UserNotFoundException();
      if (foundUser.driverProfile) {
        const foundDriver: IDriver = await this.driverModel.findById(foundUser.driverProfile);
        if (!foundDriver) throw new DriverNotFoundException();
        foundDriver.user = userId;
        foundDriver.car = {
          ...foundDriver.car,
          ...carData
        };
        return await foundDriver.save();
      } else {
        const newDriverProfile: IDriver = new this.driverModel({
          car: carData
        });
        foundUser.driverProfile = newDriverProfile._id;
        return await Promise.all([newDriverProfile.save(), foundUser.save()]);
      }
    } catch (e) {
      throw e;
    }
  };
}
