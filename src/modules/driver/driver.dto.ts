import { ValidateNested } from 'class-validator';
import { CarDto } from './car.dto';

export class DriverDto {
  @ValidateNested()
  car: CarDto;
}
