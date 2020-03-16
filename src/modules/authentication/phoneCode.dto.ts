import { IsNumber } from 'class-validator';

export class PhoneCodeDto {
  @IsNumber()
  code: number;
}
