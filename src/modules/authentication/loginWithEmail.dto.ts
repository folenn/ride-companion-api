import { IsEmail, IsString, ValidateIf, MinLength, IsPhoneNumber } from 'class-validator';

export class LoginWithEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(5)
  password: string;
}
