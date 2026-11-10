import { Types } from "mongoose";
import { BusClass, BusSize, CITIES, CityCode, TripStatus } from "../constants";
import { Booking, Bus, Trip } from "../models";
import { AppError } from "../utils/AppError";
import { buildSeatMap, seatCount } from "../utils/seatMap";
import { dayRange, daysRange, localDateTime } from "../utils/time";
import { requireActiveBus } from "./bus.service";

interface LeanBus {
  _id: Types.ObjectId;
  plateNumber: string;
  busClass: BusClass;
  size: BusSize;
  status: string;
}

interface LeanTrip {
  _id: Types.ObjectId;
  busId: LeanBus | Types.ObjectId | null;
  scheduleId: Types.ObjectId | null;
  from: string;
  to: string;
  seatPrice: number;
  departureAt: Date;
  bookedSeats: number[];
  status: TripStatus;
}

const BUS_FIELDS = "plateNumber busClass size status";

/** The shape every trip endpoint returns. */
export function tripView(trip: LeanTrip) {
  const bus = trip.busId && "plateNumber" in trip.busId ? trip.busId : null;
  const totalSeats = bus ? seatCount(bus.busClass, bus.size) : 0;
  return {
    _id: String(trip._id),
    scheduleId: trip.scheduleId ? String(trip.scheduleId) : null,
    from: trip.from,
    to: trip.to,
    seatPrice: trip.seatPrice,
    departureAt: trip.departureAt,
    status: trip.status,
    bookedSeats: [...trip.bookedSeats].sort((a, b) => a - b),
    bus: bus
      ? { _id: String(bus._id), plateNumber: bus.plateNumber, busClass: bus.busClass, size: bus.size }
      : null,
    totalSeats,
    availableSeats: Math.max(0, totalSeats - trip.bookedSeats.length),
  };
}

export type TripView = ReturnType<typeof tripView>;

async function findTrips(filter: Record<string, unknown>) {
  const trips = await Trip.find(filter)
    .sort({ departureAt: 1 })
    .populate("busId", BUS_FIELDS)
    .lean<LeanTrip[]>();
  return trips.map(tripView);
}

async function loadTrip(id: string) {
  const trip = await Trip.findById(id).populate("busId", BUS_FIELDS).lean<LeanTrip>();
  if (!trip) throw new AppError(404, "TRIP_NOT_FOUND", "الرحلة غير موجودة");
  return trip;
}

// ---------- Public (customer app) ----------

export async function searchTrips(q: { from: string; to: string; date: string; class?: BusClass }) {
  const { start, end } = dayRange(q.date);
  const now = new Date();
  const trips = await findTrips({
    from: q.from,
    to: q.to,
    status: "SCHEDULED",
    departureAt: { $gte: start > now ? start : now, $lt: end },
  });
  return trips.filter((t) => t.bus && (!q.class || t.bus.busClass === q.class));
}

export async function getTrip(id: string) {
  const view = tripView(await loadTrip(id));
  return {
    ...view,
    seatMap: view.bus ? buildSeatMap(view.bus.busClass, view.bus.size) : null,
  };
}

// ---------- Staff ----------

export async function tripsOfDay(q: { date: string; from?: string; to?: string }) {
  const { start, end } = dayRange(q.date);
  const filter: Record<string, unknown> = { departureAt: { $gte: start, $lt: end } };
  if (q.from) filter.from = q.from;
  if (q.to) filter.to = q.to;
  return findTrips(filter);
}

// ---------- Admin ----------

export async function adminListTrips(q: { from?: string; to?: string; status?: string; q?: string }) {
  const filter: Record<string, unknown> = {};
  if (q.from || q.to) {
    const { start, end } = daysRange(q.from ?? q.to!, q.to ?? q.from!);
    filter.departureAt = { $gte: start, $lt: end };
  }
  if (q.status) filter.status = q.status;

  if (q.q) {
    const text = q.q.trim();
    const cityCodes = CITIES.filter((c) => c.nameAr.includes(text) || c.code.includes(text.toUpperCase())).map(
      (c) => c.code,
    );
    const buses = await Bus.find({ plateNumber: { $regex: text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } })
      .select("_id")
      .lean();
    filter.$or = [
      { from: { $in: cityCodes } },
      { to: { $in: cityCodes } },
      { busId: { $in: buses.map((b) => b._id) } },
    ];
  }
  return findTrips(filter);
}

interface TripInput {
  from: CityCode;
  to: CityCode;
  busId: string;
  seatPrice: number;
  date: string;
  time: string;
}

async function assertBusFree(busId: string, departureAt: Date, exceptTripId?: string) {
  const clash = await Trip.exists({
    busId,
    departureAt,
    status: { $ne: "CANCELLED" },
    ...(exceptTripId ? { _id: { $ne: exceptTripId } } : {}),
  });
  if (clash) throw new AppError(409, "BUS_BUSY", "الباص لديه رحلة أخرى في الموعد نفسه");
}

export async function createTrip(input: TripInput) {
  await requireActiveBus(input.busId);
  const departureAt = localDateTime(input.date, input.time);
  if (departureAt <= new Date()) {
    throw new AppError(400, "PAST_DEPARTURE", "موعد الانطلاق يجب أن يكون في المستقبل");
  }
  await assertBusFree(input.busId, departureAt);
  const trip = await Trip.create({
    from: input.from,
    to: input.to,
    busId: input.busId,
    seatPrice: input.seatPrice,
    departureAt,
  });
  return getTrip(trip.id);
}

export async function updateTrip(id: string, input: Partial<TripInput>) {
  const trip = await Trip.findById(id);
  if (!trip) throw new AppError(404, "TRIP_NOT_FOUND", "الرحلة غير موجودة");
  if (trip.status !== "SCHEDULED") {
    throw new AppError(409, "TRIP_NOT_EDITABLE", "لا يمكن تعديل رحلة انطلقت أو أُلغيت");
  }

  const hasBookings = trip.bookedSeats.length > 0;
  const current = await Bus.findById(trip.busId);
  const nextBus = input.busId && input.busId !== String(trip.busId) ? await requireActiveBus(input.busId) : null;

  // With bookings, only the price and a bus with the same layout can change.
  if (hasBookings) {
    const movesRoute = (input.from && input.from !== trip.from) || (input.to && input.to !== trip.to);
    const movesTime = input.date !== undefined || input.time !== undefined;
    const changesLayout =
      nextBus && current && (nextBus.busClass !== current.busClass || nextBus.size !== current.size);
    if (movesRoute || movesTime || changesLayout) {
      throw new AppError(
        409,
        "TRIP_HAS_BOOKINGS",
        "الرحلة فيها حجوزات: يمكن تعديل السعر أو تبديل الباص بباص من النوع نفسه فقط",
      );
    }
  }

  if (input.date !== undefined || input.time !== undefined) {
    const local = new Date(trip.departureAt.getTime() + 3 * 3600 * 1000).toISOString();
    const departureAt = localDateTime(input.date ?? local.slice(0, 10), input.time ?? local.slice(11, 16));
    if (departureAt <= new Date()) {
      throw new AppError(400, "PAST_DEPARTURE", "موعد الانطلاق يجب أن يكون في المستقبل");
    }
    trip.departureAt = departureAt;
  }
  if (input.from) trip.from = input.from;
  if (input.to) trip.to = input.to;
  if (input.seatPrice !== undefined) trip.seatPrice = input.seatPrice;
  if (nextBus) trip.busId = nextBus._id;
  if (trip.from === trip.to) {
    throw new AppError(400, "SAME_CITY", "مدينة الانطلاق والوصول متطابقتان");
  }

  await assertBusFree(String(trip.busId), trip.departureAt, id);
  await trip.save();
  return getTrip(id);
}

export async function deleteTrip(id: string) {
  const trip = await Trip.findById(id);
  if (!trip) throw new AppError(404, "TRIP_NOT_FOUND", "الرحلة غير موجودة");
  if (await Booking.exists({ tripId: trip._id })) {
    throw new AppError(409, "TRIP_HAS_BOOKINGS", "الرحلة لها حجوزات، ألغِها بدل حذفها");
  }
  await trip.deleteOne();
}

/** The company cancels a trip: every confirmed booking is cancelled with a full refund due. */
export async function cancelTrip(id: string) {
  const trip = await Trip.findOneAndUpdate(
    { _id: id, status: "SCHEDULED" },
    { $set: { status: "CANCELLED", bookedSeats: [] } },
    { new: true },
  );
  if (!trip) {
    if (!(await Trip.exists({ _id: id }))) throw new AppError(404, "TRIP_NOT_FOUND", "الرحلة غير موجودة");
    throw new AppError(409, "TRIP_NOT_CANCELLABLE", "لا يمكن إلغاء رحلة انطلقت أو أُلغيت");
  }

  const result = await Booking.updateMany({ tripId: trip._id, status: "CONFIRMED" }, [
    {
      $set: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        refunded: false,
        refundAmount: "$total", // the company cancelled, so the whole amount is returned
      },
    },
  ]);
  return { trip: await getTrip(id), cancelledBookings: result.modifiedCount };
}

/** Manual status change from the admin: DEPARTED, then ARRIVED (which completes the bookings). */
export async function setTripStatus(id: string, status: "DEPARTED" | "ARRIVED") {
  const allowedFrom = status === "DEPARTED" ? ["SCHEDULED"] : ["SCHEDULED", "DEPARTED"];
  const trip = await Trip.findOneAndUpdate(
    { _id: id, status: { $in: allowedFrom } },
    { $set: { status } },
    { new: true },
  );
  if (!trip) {
    if (!(await Trip.exists({ _id: id }))) throw new AppError(404, "TRIP_NOT_FOUND", "الرحلة غير موجودة");
    throw new AppError(409, "INVALID_STATUS", "لا يمكن تغيير حالة الرحلة بهذا الترتيب");
  }
  if (status === "ARRIVED") {
    await Booking.updateMany({ tripId: trip._id, status: "CONFIRMED" }, { $set: { status: "COMPLETED" } });
  }
  return getTrip(id);
}

/** Cron: trips whose departure time has passed are marked DEPARTED. */
export async function markDepartedTrips() {
  const res = await Trip.updateMany(
    { status: "SCHEDULED", departureAt: { $lte: new Date() } },
    { $set: { status: "DEPARTED" } },
  );
  return res.modifiedCount;
}
