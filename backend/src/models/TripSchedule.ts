import { Schema, model } from "mongoose";
import { CITY_CODES, FREQUENCIES } from "../constants";

const tripScheduleSchema = new Schema(
  {
    from: { type: String, enum: [...CITY_CODES], required: true },
    to: { type: String, enum: [...CITY_CODES], required: true },
    busId: { type: Schema.Types.ObjectId, ref: "Bus", required: true },
    seatPrice: { type: Number, required: true, min: 0 },
    departureTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ }, // Damascus time
    frequency: { type: String, enum: [...FREQUENCIES], required: true },
    // DAILY: empty | WEEKLY: weekdays 0-6 (0 = Sunday) | MONTHLY: one day of the month 1-31
    days: { type: [Number], default: [] },
    startDate: { type: String, required: true }, // "YYYY-MM-DD"
    endDate: { type: String, required: true }, // "YYYY-MM-DD", inclusive
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const TripSchedule = model("TripSchedule", tripScheduleSchema);
