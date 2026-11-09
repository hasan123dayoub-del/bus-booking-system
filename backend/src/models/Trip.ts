import { Schema, model } from "mongoose";
import { CITY_CODES, TRIP_STATUSES } from "../constants";

const tripSchema = new Schema(
  {
    busId: { type: Schema.Types.ObjectId, ref: "Bus", required: true },
    scheduleId: { type: Schema.Types.ObjectId, ref: "TripSchedule", default: null },
    from: { type: String, enum: [...CITY_CODES], required: true },
    to: { type: String, enum: [...CITY_CODES], required: true },
    seatPrice: { type: Number, required: true, min: 0 },
    departureAt: { type: Date, required: true },
    bookedSeats: { type: [Number], default: [] },
    status: { type: String, enum: [...TRIP_STATUSES], default: "SCHEDULED" },
  },
  { timestamps: true },
);

tripSchema.index({ from: 1, to: 1, departureAt: 1 });

// Running the daily job twice must never generate the same trip twice.
tripSchema.index(
  { scheduleId: 1, departureAt: 1 },
  { unique: true, partialFilterExpression: { scheduleId: { $type: "objectId" } } },
);

export const Trip = model("Trip", tripSchema);
