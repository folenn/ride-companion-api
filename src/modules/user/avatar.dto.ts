import { IsNotEmpty } from 'class-validator';

export class AvatarDto {
  @IsNotEmpty()
  avatar: Express.Multer.File;
}
