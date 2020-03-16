
import { IsOptional, IsString, IsEmail, MinLength, IsNotEmpty, ValidateIf, IsPhoneNumber } from 'class-validator';

export class UserDetailsDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @IsPhoneNumber('UA')
  phone: string;
}

export class CreateUserByEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(5)
  password: string;
}

export class CreateUserByPhoneDto {
  @IsPhoneNumber('UA')
  phone: string;
}
