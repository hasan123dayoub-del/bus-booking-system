import { BusClass, BusSize } from "../constants";
import { Booking, Trip } from "../models";
import { seatCount } from "../utils/seatMap";
import { addDays, dayRange, daysRange, localDate } from "../utils/time";

const PAID = ["CONFIRMED", "COMPLETED"];
const rate = (booked: number, total: number) => (total ? Math.round((booked / total) * 100) : 0);

/** Seat occupancy of the trips that depart in the range (cancelled trips excluded). */
export async function occupancy(from: string, to: string) {
  const { start, end } = daysRange(from, to);
  const trips = await Trip.find({ departureAt: { $gte: start, $lt: end }, status: { $ne: "CANCELLED" } })
    .populate<{ busId: { busClass: BusClass; size: BusSize } | null }>("busId", "busClass size")
    .lean();

  const routes = new Map<string, { from: string; to: string; trips: number; bookedSeats: number; totalSeats: number }>();
  let bookedSeats = 0;
  let totalSeats = 0;
  for (const t of trips) {
    if (!t.busId) continue;
    const seats = seatCount(t.busId.busClass, t.busId.size);
    bookedSeats += t.bookedSeats.length;
    totalSeats += seats;
    const key = `${t.from}-${t.to}`;
    const r = routes.get(key) ?? { from: t.from, to: t.to, trips: 0, bookedSeats: 0, totalSeats: 0 };
    r.trips += 1;
    r.bookedSeats += t.bookedSeats.length;
    r.totalSeats += seats;
    routes.set(key, r);
  }

  return {
    from,
    to,
    trips: trips.length,
    bookedSeats,
    totalSeats,
    rate: rate(bookedSeats, totalSeats),
    byRoute: [...routes.values()]
      .map((r) => ({ ...r, rate: rate(r.bookedSeats, r.totalSeats) }))
      .sort((a, b) => b.rate - a.rate),
  };
}

/** Money taken by bookings made in the range (cancelled bookings are refunded, so excluded). */
export async function revenue(from: string, to: string) {
  const { start, end } = daysRange(from, to);
  const rows = await Booking.aggregate<{ _id: string; total: number; bookings: number; seats: number }>([
    { $match: { createdAt: { $gte: start, $lt: end }, status: { $in: PAID } } },
    {
      $group: {
        _id: { $dateToString: { date: "$createdAt", format: "%Y-%m-%d", timezone: "+03:00" } },
        total: { $sum: "$total" },
        bookings: { $sum: 1 },
        seats: { $sum: { $size: "$seats" } },
      },
    },
  ]);
  const byDate = new Map(rows.map((r) => [r._id, r]));

  const byDay = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const r = byDate.get(d);
    byDay.push({ date: d, total: r?.total ?? 0, bookings: r?.bookings ?? 0 });
  }
  // One day: also split by hour (Damascus time) for the "today" chart
  let byHour: { hour: number; total: number; bookings: number }[] | undefined;
  if (from === to) {
    const hours = await Booking.aggregate<{ _id: string; total: number; bookings: number }>([
      { $match: { createdAt: { $gte: start, $lt: end }, status: { $in: PAID } } },
      {
        $group: {
          _id: { $dateToString: { date: "$createdAt", format: "%H", timezone: "+03:00" } },
          total: { $sum: "$total" },
          bookings: { $sum: 1 },
        },
      },
    ]);
    const byH = new Map(hours.map((h) => [Number(h._id), h]));
    byHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      total: byH.get(hour)?.total ?? 0,
      bookings: byH.get(hour)?.bookings ?? 0,
    }));
  }

  return {
    from,
    to,
    total: byDay.reduce((s, d) => s + d.total, 0),
    bookings: byDay.reduce((s, d) => s + d.bookings, 0),
    byDay,
    ...(byHour ? { byHour } : {}),
  };
}

/** Dashboard numbers for one day, with the day before for comparison. */
export async function summary(date: string = localDate()) {
  const yesterday = addDays(date, -1);
  const { start, end } = dayRange(date);
  const [occToday, occYesterday, revToday, revYesterday, tripsToday] = await Promise.all([
    occupancy(date, date),
    occupancy(yesterday, yesterday),
    revenue(date, date),
    revenue(yesterday, yesterday),
    Trip.find({ departureAt: { $gte: start, $lt: end } }).select("status").lean(),
  ]);
  return {
    date,
    trips: { total: tripsToday.length, departed: tripsToday.filter((t) => t.status === "DEPARTED").length },
    occupancy: { rate: occToday.rate, change: occToday.rate - occYesterday.rate },
    revenue: {
      total: revToday.total,
      changePercent: revYesterday.total
        ? Math.round(((revToday.total - revYesterday.total) / revYesterday.total) * 100)
        : null,
    },
    bookings: {
      total: revToday.bookings,
      changePercent: revYesterday.bookings
        ? Math.round(((revToday.bookings - revYesterday.bookings) / revYesterday.bookings) * 100)
        : null,
    },
  };
}
