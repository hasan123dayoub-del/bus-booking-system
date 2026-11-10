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
    // The customer's account, when there is one (app bookings, or an office booking for a known phone)
    customerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    // The staff member who made an office booking
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true },
    seats: { type: [seatSchema], required: true },
    seatPrice: { type: Number, required: true }, // copied from the trip at booking time
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: [...PAYMENT_METHODS], required: true },
    paymentRef: { type: String, default: null }, // Sham Cash transfer number
    channel: { type: String, enum: [...BOOKING_CHANNELS], required: true },
    status: { type: String, enum: [...BOOKING_STATUSES], default: "CONFIRMED" },
    cancelledAt: { type: Date, default: null },
    refundAmount: { type: Number, default: 0 },
    refunded: { type: Boolean, default: false },
    refundedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

bookingSchema.index({ tripId: 1, status: 1 });
bookingSchema.index({ customerId: 1, createdAt: -1 });
bookingSchema.index({ status: 1, refunded: 1 });
bookingSchema.index({ createdAt: -1 });

export const Booking = model("Booking", bookingSchema);
