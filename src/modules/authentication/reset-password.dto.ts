import { IsString, Min, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  password: string;

  @IsString()
  @MinLength(5)
  newPassword: string;
}
