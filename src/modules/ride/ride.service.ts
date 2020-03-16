import { RideModel } from './ride.model';
import { UserModel } from '../user/user.model';
import { RideDto } from './ride.dto';
import UserNotFoundException from '../../exceptions/user-not-found.exception';
import { FindRideDto } from './find-ride.dto';
import { IRide } from './ride.interface';
import NodeGeocoder, { Options } from 'node-geocoder';
import GoogleMapsClient, { ClientResponse, PlaceSearchResponse } from '@google/maps';

const googleMapsClient = require('@google/maps').createClient({
	key: process.env.GEOCODER_API_KEY,
	Promise: Promise
});

export class RideService {
	public userModel = UserModel;
	public rideModel = RideModel;
	private geocoder = GoogleMapsClient.createClient({
		key: process.env.GEOCODER_API_KEY,
		Promise: Promise
	});

	public async createRide(userId: string, rideData: RideDto) {
		try {
			const foundUser = await this.userModel.findById(userId);
			if (!foundUser) throw new UserNotFoundException();

			return await this.rideModel.create({...rideData, owner: userId});
		} catch (e) {
			throw e;
		}
	}

	public async findRide(findRideData: FindRideDto) {
		try {
			const [{json: {results: rideFrom}}, {json: {results: rideTo}}]: ClientResponse<PlaceSearchResponse>[] = await Promise.all([
				googleMapsClient.geocode({address: findRideData.rideFrom}).asPromise(),
				googleMapsClient.geocode({address: findRideData.rideTo}).asPromise()
			]);
			const foundRideFromCoords = rideFrom.find(result => result.types.some(type => type === ('locality' || 'political')));
			const foundRideToCoords = rideTo.find(result => result.types.some(type => type === ('locality' || 'political')));
			const rideFromDiagonalDistance = this.calculateDistance({
				latitude: foundRideFromCoords && foundRideFromCoords.geometry && foundRideFromCoords.geometry.bounds && foundRideFromCoords.geometry.bounds.northeast && foundRideFromCoords.geometry.bounds.northeast.lat,
		    longitude: foundRideFromCoords && foundRideFromCoords.geometry && foundRideFromCoords.geometry.bounds && foundRideFromCoords.geometry.bounds.northeast && foundRideFromCoords.geometry.bounds.northeast.lng
			}, {
				latitude: foundRideFromCoords && foundRideFromCoords.geometry && foundRideFromCoords.geometry.bounds && foundRideFromCoords.geometry.bounds.southwest && foundRideFromCoords.geometry.bounds.southwest.lat,
		    longitude: foundRideFromCoords && foundRideFromCoords.geometry && foundRideFromCoords.geometry.bounds && foundRideFromCoords.geometry.bounds.southwest && foundRideFromCoords.geometry.bounds.southwest.lng
			});
			const rideToDiagonalDistance = this.calculateDistance({
				latitude: foundRideToCoords && foundRideToCoords.geometry && foundRideToCoords.geometry.bounds && foundRideToCoords.geometry.bounds.northeast && foundRideToCoords.geometry.bounds.northeast.lat,
				longitude: foundRideToCoords && foundRideToCoords.geometry && foundRideToCoords.geometry.bounds && foundRideToCoords.geometry.bounds.northeast && foundRideToCoords.geometry.bounds.northeast.lng
			}, {
				latitude: foundRideToCoords && foundRideToCoords.geometry && foundRideToCoords.geometry.bounds && foundRideToCoords.geometry.bounds.southwest && foundRideToCoords.geometry.bounds.southwest.lat,
				longitude: foundRideToCoords && foundRideToCoords.geometry && foundRideToCoords.geometry.bounds && foundRideToCoords.geometry.bounds.southwest && foundRideToCoords.geometry.bounds.southwest.lng
			});
			const dateMaxFilter = new Date(findRideData && findRideData.date);
			dateMaxFilter.setHours(23, 59);
			const rides = await this.rideModel.find({
				passengersCount: {
					$gte: findRideData && findRideData.passengersCount
				},
				date: {
					$gte: findRideData && findRideData.date,
					$lt: dateMaxFilter.toISOString()
				}
			});
			const foundRides: IRide[] = [];
			rides.forEach(ride => {
				let nearStartIndex = 0;
				let nearEndIndex = 0;
				const nearStart = ride.coordinates.some((coordinate, i) => {
						const statement = this.calculateDistance(coordinate, {
							latitude: +rideFrom[0].geometry.location.lat,
							longitude: +rideFrom[0].geometry.location.lng
						}) <= (+rideFromDiagonalDistance > 10 ? +rideFromDiagonalDistance : 10);
						if (statement) {
							nearStartIndex = i;
							return statement;
						} else {
							return false;
						}
					}
				);

				const nearEnd = ride.coordinates.some((coordinate, i) => {
						const statement = this.calculateDistance(coordinate, {
							latitude: +rideTo[0].geometry.location.lat,
							longitude: +rideTo[0].geometry.location.lng
						}) <= (+rideToDiagonalDistance > 10 ? +rideToDiagonalDistance : 10);
						if (statement) {
							nearEndIndex = i;
							return statement;
						} else {
							return false;
						}
					}
				);
				if ((nearStart && nearEnd) && (nearStartIndex < nearEndIndex)) {
					foundRides.push(ride);
				}
			});
			return foundRides;
		} catch (e) {
			console.log(e);
			throw e;
		}
	}

	private calculateDistance(pointA: { latitude: number, longitude: number }, pointB: { latitude: number, longitude: number }) {
		const lat1 = pointA.latitude;
		const lon1 = pointA.longitude;

		const lat2 = pointB.latitude;
		const lon2 = pointB.longitude;

		const R = 6371e3; // earth radius in meters
		const φ1 = lat1 * (Math.PI / 180);
		const φ2 = lat2 * (Math.PI / 180);
		const Δφ = (lat2 - lat1) * (Math.PI / 180);
		const Δλ = (lon2 - lon1) * (Math.PI / 180);

		const a = (Math.sin(Δφ / 2) * Math.sin(Δφ / 2)) +
			((Math.cos(φ1) * Math.cos(φ2)) * (Math.sin(Δλ / 2) * Math.sin(Δλ / 2)));

		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

		const distance = R * c;
		return distance / 1000; // in kilometers
	}
}
