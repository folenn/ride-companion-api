import { IsEmail, IsPhoneNumber, ValidateIf } from 'class-validator';

export class AuthResetDto {
  @ValidateIf(o => !o.phone)
  @IsEmail()
  email: string;

  @ValidateIf(o => !o.email)
  @IsPhoneNumber('UA')
  phone: string;
}
