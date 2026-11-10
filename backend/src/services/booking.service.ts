import { Types } from "mongoose";
import {
  BusClass,
  BusSize,
  CANCEL_DEADLINE_HOURS,
  PaymentMethod,
  REFUND_PERCENT,
} from "../constants";
import { Booking, Bus, Trip, User } from "../models";
import { AppError } from "../utils/AppError";
import { newBookingCode } from "../utils/bookingCode";
import { isValidSeat } from "../utils/seatMap";
import { dayRange } from "../utils/time";
import { getTrip } from "./trip.service";

type SeatInput = { seatNumber: number; passengerName?: string };
type BookingDoc = InstanceType<typeof Booking>;

const HOUR_MS = 60 * 60 * 1000;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

interface NewBooking {
  tripId: string;
  seats: SeatInput[];
  customerId: Types.ObjectId | string | null;
  createdBy: Types.ObjectId | string | null;
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  paymentRef: string | null;
  channel: "APP" | "RECEPTION";
}

/**
 * Books seats with one atomic update: the trip is only updated when none of the
 * requested seats is already in bookedSeats. Two people racing for the same seat:
 * exactly one wins, the other gets 409.
 */
async function book(input: NewBooking) {
  const trip = await Trip.findById(input.tripId);
  if (!trip) throw new AppError(404, "TRIP_NOT_FOUND", "الرحلة غير موجودة");
  if (trip.status !== "SCHEDULED" || trip.departureAt <= new Date()) {
    throw new AppError(409, "TRIP_CLOSED", "الحجز مغلق لهذه الرحلة");
  }

  const bus = await Bus.findById(trip.busId);
  if (!bus) throw new AppError(404, "BUS_NOT_FOUND", "الباص غير موجود");
  const seatNumbers = input.seats.map((s) => s.seatNumber);
  const invalid = seatNumbers.filter((n) => !isValidSeat(bus.busClass as BusClass, bus.size as BusSize, n));
  if (invalid.length) {
    throw new AppError(400, "INVALID_SEAT", `رقم مقعد غير موجود في هذا الباص: ${invalid.join("، ")}`);
  }

  const res = await Trip.updateOne(
    { _id: trip._id, status: "SCHEDULED", bookedSeats: { $nin: seatNumbers } },
    { $push: { bookedSeats: { $each: seatNumbers } } },
  );
  if (res.modifiedCount === 0) {
    throw new AppError(409, "SEAT_TAKEN", "أحد المقاعد المختارة حُجز للتو، اختر مقعداً آخر");
  }

  try {
    const base = {
      tripId: trip._id,
      customerId: input.customerId,
      createdBy: input.createdBy,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      seats: input.seats.map((s) => ({
        seatNumber: s.seatNumber,
        passengerName: s.passengerName?.trim() || input.customerName,
      })),
      seatPrice: trip.seatPrice, // price snapshot
      total: trip.seatPrice * seatNumbers.length,
      paymentMethod: input.paymentMethod,
      paymentRef: input.paymentRef,
      channel: input.channel,
      status: "CONFIRMED",
    };
    // Retry on the (very unlikely) booking code collision
    for (let attempt = 0; ; attempt++) {
      try {
        return await Booking.create({ ...base, code: newBookingCode() });
      } catch (err) {
        if ((err as { code?: number }).code !== 11000 || attempt >= 4) throw err;
      }
    }
  } catch (err) {
    // Give the seats back if the booking could not be saved
    await Trip.updateOne({ _id: trip._id }, { $pull: { bookedSeats: { $in: seatNumbers } } });
    throw err;
  }
}

// ---------- Views ----------

async function withTrip(bookings: BookingDoc[]) {
  const tripIds = [...new Set(bookings.map((b) => String(b.tripId)))];
  const trips = await Trip.find({ _id: { $in: tripIds } })
    .populate("busId", "plateNumber busClass size")
    .lean();
  const byId = new Map(trips.map((t) => [String(t._id), t]));
  return bookings.map((b) => {
    const t = byId.get(String(b.tripId)) as
      | (Record<string, unknown> & { busId?: Record<string, unknown> | null })
      | undefined;
    return {
      ...b.toJSON(),
      trip: t
        ? {
            _id: String(t._id),
            from: t.from,
            to: t.to,
            departureAt: t.departureAt,
            status: t.status,
            seatPrice: t.seatPrice,
            bus: t.busId ?? null,
          }
        : null,
    };
  });
}

export const bookingView = async (b: BookingDoc) => (await withTrip([b]))[0];

// ---------- Customer ----------

export async function createAppBooking(
  customerId: string,
  input: { tripId: string; seats: SeatInput[]; paymentRef: string },
) {
  const user = await User.findById(customerId);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "المستخدم غير موجود");
  const booking = await book({
    tripId: input.tripId,
    seats: input.seats,
    customerId: user._id,
    createdBy: null,
    customerName: user.name,
    customerPhone: user.phone,
    paymentMethod: "SHAM_CASH", // the app only accepts Sham Cash
    paymentRef: input.paymentRef,
    channel: "APP",
  });
  return bookingView(booking);
}

export async function myBookings(customerId: string) {
  const bookings = await Booking.find({ customerId }).sort({ createdAt: -1 });
  const views = await withTrip(bookings);
  const now = Date.now();
  return views.map((b) => {
    const departure = b.trip ? new Date(b.trip.departureAt as Date).getTime() : 0;
    return {
      ...b,
      // The app shows the cancel button only while this is true
      canCancel: b.status === "CONFIRMED" && departure - now >= CANCEL_DEADLINE_HOURS * HOUR_MS,
      refundIfCancelled: Math.round((b.total * REFUND_PERCENT) / 100),
    };
  });
}

// ---------- Cancel / refund ----------

async function cancel(booking: BookingDoc, refundPercent: number) {
  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, status: "CONFIRMED" },
    {
      $set: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        refunded: false,
        refundAmount: Math.round((booking.total * refundPercent) / 100),
      },
    },
    { new: true },
  );
  if (!updated) throw new AppError(409, "NOT_CANCELLABLE", "الحجز ملغى أو مكتمل مسبقاً");
  await Trip.updateOne(
    { _id: booking.tripId },
    { $pull: { bookedSeats: { $in: booking.seats.map((s) => s.seatNumber) } } },
  );
  return bookingView(updated);
}

export async function cancelByCustomer(customerId: string, bookingId: string) {
  const booking = await Booking.findById(bookingId);
  if (!booking || String(booking.customerId) !== customerId) {
    throw new AppError(404, "BOOKING_NOT_FOUND", "الحجز غير موجود");
  }
  const trip = await Trip.findById(booking.tripId);
  if (!trip || trip.departureAt.getTime() - Date.now() < CANCEL_DEADLINE_HOURS * HOUR_MS) {
    throw new AppError(
      409,
      "CANCEL_DEADLINE_PASSED",
      `انتهت مهلة الإلغاء (${CANCEL_DEADLINE_HOURS} ساعة قبل الانطلاق). راجع مكتب الاستقبال`,
    );
  }
  return cancel(booking, REFUND_PERCENT);
}

/** Staff can cancel any confirmed booking until the trip departs. */
export async function cancelByStaff(bookingId: string) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError(404, "BOOKING_NOT_FOUND", "الحجز غير موجود");
  const trip = await Trip.findById(booking.tripId);
  if (!trip || trip.status !== "SCHEDULED" || trip.departureAt <= new Date()) {
    throw new AppError(409, "TRIP_DEPARTED", "لا يمكن إلغاء حجز رحلة انطلقت");
  }
  return cancel(booking, REFUND_PERCENT);
}

/** Reception returned the money (Sham Cash transfer or cash) and records it. */
export async function markRefunded(bookingId: string) {
  const booking = await Booking.findOneAndUpdate(
    { _id: bookingId, status: "CANCELLED", refunded: false },
    { $set: { refunded: true, refundedAt: new Date() } },
    { new: true },
  );
  if (!booking) {
    if (!(await Booking.exists({ _id: bookingId }))) {
      throw new AppError(404, "BOOKING_NOT_FOUND", "الحجز غير موجود");
    }
    throw new AppError(409, "NOT_REFUNDABLE", "الحجز غير ملغى أو تم استرداد مبلغه مسبقاً");
  }
  return bookingView(booking);
}

// ---------- Staff ----------

export async function createStaffBooking(
  staffId: string,
  input: {
    tripId: string;
    customerName: string;
    customerPhone: string;
    seats: SeatInput[];
    paymentMethod: PaymentMethod;
    paymentRef?: string;
  },
) {
  // Link to the customer's app account when the phone is known, so it shows in "My bookings"
  const account = await User.findOne({ phone: input.customerPhone, role: "CUSTOMER" }).select("_id");
  const booking = await book({
    tripId: input.tripId,
    seats: input.seats,
    customerId: account?._id ?? null,
    createdBy: staffId,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    paymentMethod: input.paymentMethod,
    paymentRef: input.paymentMethod === "SHAM_CASH" ? (input.paymentRef ?? null) : null,
    channel: "RECEPTION",
  });
  return bookingView(booking);
}

/** Moves one passenger to a free seat on the same trip, atomically. */
export async function changeSeat(bookingId: string, input: { seatNumber: number; newSeatNumber: number }) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError(404, "BOOKING_NOT_FOUND", "الحجز غير موجود");
  if (booking.status !== "CONFIRMED") {
    throw new AppError(409, "NOT_CONFIRMED", "لا يمكن تغيير مقعد في حجز غير مؤكد");
  }
  const seat = booking.seats.find((s) => s.seatNumber === input.seatNumber);
  if (!seat) throw new AppError(400, "SEAT_NOT_IN_BOOKING", "المقعد ليس ضمن هذا الحجز");
  if (input.seatNumber === input.newSeatNumber) return bookingView(booking);

  const trip = await Trip.findById(booking.tripId);
  if (!trip || trip.status !== "SCHEDULED") {
    throw new AppError(409, "TRIP_CLOSED", "لا يمكن تغيير المقعد بعد انطلاق الرحلة");
  }
  const bus = await Bus.findById(trip.busId);
  if (!bus || !isValidSeat(bus.busClass as BusClass, bus.size as BusSize, input.newSeatNumber)) {
    throw new AppError(400, "INVALID_SEAT", "رقم المقعد غير موجود في هذا الباص");
  }

  const taken = await Trip.updateOne(
    { _id: trip._id, bookedSeats: { $ne: input.newSeatNumber } },
    { $push: { bookedSeats: input.newSeatNumber } },
  );
  if (taken.modifiedCount === 0) throw new AppError(409, "SEAT_TAKEN", "المقعد الجديد محجوز");
  await Trip.updateOne({ _id: trip._id }, { $pull: { bookedSeats: input.seatNumber } });

  seat.seatNumber = input.newSeatNumber;
  booking.seats.sort((a, b) => a.seatNumber - b.seatNumber);
  await booking.save();
  return bookingView(booking);
}

export async function listStaffBookings(q: {
  q?: string;
  date?: string;
  tripId?: string;
  status?: string;
  refunded?: boolean;
  page: number;
  limit: number;
}) {
  const filter: Record<string, unknown> = {};
  if (q.status) filter.status = q.status;
  if (q.refunded !== undefined) filter.refunded = q.refunded;
  if (q.tripId) filter.tripId = q.tripId;
  if (q.date) {
    const { start, end } = dayRange(q.date);
    const trips = await Trip.find({ departureAt: { $gte: start, $lt: end } }).select("_id").lean();
    const ids = trips.map((t) => t._id);
    filter.tripId = q.tripId ? { $in: ids.filter((id) => String(id) === q.tripId) } : { $in: ids };
  }
  if (q.q) {
    const text = escapeRegex(q.q);
    const digits = q.q.replace(/\D/g, "").replace(/^0+/, "");
    filter.$or = [
      { code: { $regex: text, $options: "i" } },
      { customerName: { $regex: text, $options: "i" } },
      ...(digits.length >= 3 ? [{ customerPhone: { $regex: digits } }] : []),
    ];
  }

  const [items, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit),
    Booking.countDocuments(filter),
  ]);
  return {
    data: await withTrip(items),
    meta: { page: q.page, limit: q.limit, total, pages: Math.max(1, Math.ceil(total / q.limit)) },
  };
}

/** Passenger list of a trip, with seat counts. */
export async function manifest(tripId: string) {
  const trip = await getTrip(tripId);
  const bookings = await Booking.find({ tripId, status: { $in: ["CONFIRMED", "COMPLETED"] } }).sort({
    createdAt: 1,
  });
  const passengers = bookings
    .flatMap((b) =>
      b.seats.map((s) => ({
        seatNumber: s.seatNumber,
        passengerName: s.passengerName,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        bookingId: String(b._id),
        bookingCode: b.code,
        paymentMethod: b.paymentMethod,
      })),
    )
    .sort((a, b) => a.seatNumber - b.seatNumber);
  return {
    trip,
    passengers,
    bookings: bookings.map((b) => b.toJSON()),
    stats: {
      booked: trip.bookedSeats.length,
      available: trip.availableSeats,
      total: trip.totalSeats,
    },
  };
}

