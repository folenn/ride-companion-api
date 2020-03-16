import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CarDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  number: string;
}
