import { Schema, model, Document } from "mongoose";
import { IRide } from "./ride.interface";

const rideSchema = new Schema({
    passengers: [{type: Schema.Types.ObjectId, ref: 'User'}],
    passengersCount: {type: Number, required: true},
    owner: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    date: {type: Date, required: true},
    imageUrl: String,
    coordinates: {
        type: [],
        required: true
    },
    rideFromName: {type: String, required: true},
    rideToName: {type: String, required: true}
});
export const RideModel = model<IRide & Document>('ride', rideSchema);
