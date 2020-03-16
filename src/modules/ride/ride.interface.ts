import { Schema } from 'mongoose';

export interface IRide extends Document {
	_id: Schema.Types.ObjectId;
	owner: Schema.Types.ObjectId;
	date: Date;
	coordinates: ICoordinate[];
	rideFromName: string;
	rideToName: string;
	passengersCount: string | number;
	passengers?: Schema.Types.ObjectId[];
	imageUrl?: string;
}

export interface ICoordinate {
	longitude: number;
	latitude: number;
}
