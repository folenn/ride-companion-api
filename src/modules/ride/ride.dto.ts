import {
    IsOptional,
    IsString,
    IsEmail,
    MinLength,
    IsNotEmpty,
    ValidateIf,
    IsPhoneNumber,
    IsDate,
    IsArray,
    IsDateString, IsNumberString
} from 'class-validator';
import { ICoordinate } from './ride.interface';

export class RideDto {
    @IsDateString()
    @IsNotEmpty()
    date: Date;

    @IsArray()
    @IsNotEmpty()
    coordinates: ICoordinate[];

    @IsNumberString()
    @IsNotEmpty()
    passengersCount: number | string;

    @IsString()
    @IsNotEmpty()
    rideFromName: string;

    @IsString()
    @IsNotEmpty()
    rideToName: string;
}
