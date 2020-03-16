import { UserModel } from './user.model';
import { UserDetailsDto } from './user.dto';
import UserNotFoundException from '../../exceptions/user-not-found.exception';

export class UserService {
  public userModel = UserModel;

  public async updateUserProfile(userId: string, data: UserDetailsDto) {
    try {
      await this.userModel.findOneAndUpdate({_id: userId}, {
        $set: {
          'details.name': data.name,
          firstLogin: false
        }
      });
      return true;
    } catch (e) {
      throw e;
    }
  };

  public async updateUserAvatar(userId: string, filename: string): Promise<string> {
    try {
      const imageUrl = `http://localhost:3000/public/avatars/${filename}`;
      const updatedUser = await this.userModel.findOneAndUpdate({_id: userId}, {
        $set: {
          'details.imageUrl': imageUrl
        }
      });
      if (!updatedUser) throw new UserNotFoundException();

      return imageUrl;
    } catch (e) {
      throw e;
    }
  };
}
