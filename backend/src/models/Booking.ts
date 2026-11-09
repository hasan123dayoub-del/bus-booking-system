import { Schema, model } from "mongoose";
import { BOOKING_CHANNELS, BOOKING_STATUSES, PAYMENT_METHODS } from "../constants";

const seatSchema = new Schema(
  {
    seatNumber: { type: Number, required: true },
    passengerName: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const bookingSchema = new Schema(
  {
    code: { type: String, required: true, unique: true }, // e.g. BK-7F3K9Q
    tripId: { type: Schema.Types.ObjectId, ref: "Trip", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    // Office bookings: the customer may not have an account
    customerName: { type: String, trim: true },
    customerPhone: { type: String },
    seats: { type: [seatSchema], required: true },
    seatPrice: { type: Number, required: true }, // copied from the trip at booking time
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: [...PAYMENT_METHODS], required: true },
    paymentRef: { type: String },
    channel: { type: String, enum: [...BOOKING_CHANNELS], required: true },
    status: { type: String, enum: [...BOOKING_STATUSES], default: "CONFIRMED" },
  },
  { timestamps: true },
);

bookingSchema.index({ tripId: 1 });
bookingSchema.index({ customerId: 1, createdAt: -1 });

export const Booking = model("Booking", bookingSchema);
