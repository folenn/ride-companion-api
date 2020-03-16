import { IsPhoneNumber, ValidateIf } from 'class-validator';

export class LoginWithPhoneDto {
  @IsPhoneNumber('UA')
  phone: string;
}
