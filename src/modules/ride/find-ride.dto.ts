import { IsDateString, IsNotEmpty, IsNumberString, IsString } from 'class-validator'

export class FindRideDto {
	@IsDateString()
	date: string;

	@IsNumberString()
	@IsNotEmpty()
	passengersCount: number;

	@IsString()
	@IsNotEmpty()
	rideFrom: string;

	@IsString()
	@IsNotEmpty()
	rideTo: string;
}
