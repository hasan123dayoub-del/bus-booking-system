/**
 * Fills a LOCAL database with demo data (staff, buses, schedules, two weeks of trips and bookings).
 * It deletes everything first, so it refuses to run in production.
 *
 *   npm run seed:demo
 */
import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "../config/db";
import { env } from "../config/env";
import { BusClass, BusSize } from "../constants";
import { Booking, Bus, Trip, TripSchedule, User } from "../models";
import { generateAllTrips, runsOn } from "../services/schedule.service";
import { newBookingCode } from "../utils/bookingCode";
import { normalizeSyrianPhone } from "../utils/phone";
import { seatCount } from "../utils/seatMap";
import { addDays, localDate, localDateTime } from "../utils/time";

const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "Rihlati123";

// Deterministic random numbers so every seed gives the same data
let state = 20261106;
const rand = () => ((state = (state * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = <T>(list: T[]) => list[Math.floor(rand() * list.length)];

const FIRST = ["سامر", "ريما", "يوسف", "هدى", "محمد", "لينا", "عمر", "سلمى", "أحمد", "نور", "خالد", "ميس", "باسل", "رهف", "طارق", "جود", "علي", "تالا"];
const LAST = ["الأحمد", "خليل", "درويش", "العلي", "ناصر", "صالح", "حداد", "الحسن", "منصور", "عيسى", "شاهين", "الخطيب", "سليمان", "يوسف"];
const phone = () => `+9639${[3, 4, 5, 8, 9][Math.floor(rand() * 5)]}${String(Math.floor(rand() * 1e7)).padStart(7, "0")}`;

async function main() {
  if (env.NODE_ENV === "production") throw new Error("seed:demo deletes all data; not allowed in production");
  await connectDB();
  for (const m of [User, Bus, Trip, TripSchedule, Booking] as unknown as { deleteMany: (f: object) => Promise<unknown> }[]) await m.deleteMany({});

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = (name: string, p: string, role: string, active = true) =>
    User.create({ name, phone: normalizeSyrianPhone(p), passwordHash: hash, role, active });

  await user("مدير النظام", "0900000000", "ADMIN");
  const staff = [
    await user("ليلى الحسن", "0944120981", "RECEPTIONIST"),
    await user("خالد منصور", "0933508214", "RECEPTIONIST"),
    await user("رنا عيسى", "0955877340", "RECEPTIONIST"),
    await user("أيمن شاهين", "0931205667", "RECEPTIONIST", false),
  ];
  const customers = [
    await user("سامر الأحمد", "0944123456", "CUSTOMER"),
    await user("ريما خليل", "0933245118", "CUSTOMER"),
  ];

  const busRows: [string, BusClass, BusSize, string?][] = [
    ["أ-214", "REGULAR", "LARGE"],
    ["ب-188", "FIRST_CLASS", "MEDIUM"],
    ["ج-230", "BUSINESS", "LARGE"],
    ["أ-175", "REGULAR", "MEDIUM", "MAINTENANCE"],
    ["د-301", "FIRST_CLASS", "LARGE"],
    ["هـ-122", "BUSINESS", "MEDIUM"],
    ["و-405", "REGULAR", "LARGE"],
    ["ي-318", "FIRST_CLASS", "MEDIUM"],
    ["ز-512", "REGULAR", "LARGE"],
    ["ح-640", "FIRST_CLASS", "LARGE"],
  ];
  // One by one so the list keeps this order
  const buses: Record<string, InstanceType<typeof Bus>> = {};
  for (const [plateNumber, busClass, size, status] of busRows) {
    buses[plateNumber] = await Bus.create({ plateNumber, busClass, size, status: status ?? "ACTIVE" });
  }

  const today = localDate();
  const start = addDays(today, -7);
  const schedules = await TripSchedule.create([
    { from: "DAMASCUS", to: "ALEPPO", busId: buses["أ-214"]._id, seatPrice: 85000, departureTime: "06:00", frequency: "DAILY", days: [], startDate: start, endDate: addDays(today, 60) },
    { from: "DAMASCUS", to: "ALEPPO", busId: buses["ب-188"]._id, seatPrice: 120000, departureTime: "08:30", frequency: "DAILY", days: [], startDate: start, endDate: addDays(today, 60) },
    { from: "DAMASCUS", to: "LATAKIA", busId: buses["ج-230"]._id, seatPrice: 180000, departureTime: "09:15", frequency: "WEEKLY", days: [0, 2, 4, 5], startDate: start, endDate: addDays(today, 60) },
    { from: "DAMASCUS", to: "HOMS", busId: buses["و-405"]._id, seatPrice: 45000, departureTime: "11:00", frequency: "DAILY", days: [], startDate: start, endDate: addDays(today, 30) },
    { from: "ALEPPO", to: "LATAKIA", busId: buses["د-301"]._id, seatPrice: 95000, departureTime: "07:30", frequency: "WEEKLY", days: [3, 6], startDate: start, endDate: addDays(today, 90) },
    { from: "DAMASCUS", to: "TARTUS", busId: buses["ي-318"]._id, seatPrice: 60000, departureTime: "10:00", frequency: "MONTHLY", days: [15], startDate: start, endDate: addDays(today, 200), active: false },
    { from: "DAMASCUS", to: "HAMA", busId: buses["ز-512"]._id, seatPrice: 50000, departureTime: "14:00", frequency: "DAILY", days: [], startDate: start, endDate: addDays(today, 45) },
    { from: "HOMS", to: "DAMASCUS", busId: buses["ح-640"]._id, seatPrice: 70000, departureTime: "17:30", frequency: "DAILY", days: [], startDate: start, endDate: addDays(today, 45) },
    { from: "DAMASCUS", to: "DARAA", busId: buses["أ-214"]._id, seatPrice: 35000, departureTime: "20:00", frequency: "DAILY", days: [], startDate: start, endDate: addDays(today, 45) },
  ]);

  // Past week: the generator only creates future trips, so build them here
  const now = new Date();
  for (const s of schedules.filter((x) => x.active)) {
    for (let d = start; d <= today; d = addDays(d, 1)) {
      const departureAt = localDateTime(d, s.departureTime);
      if (departureAt > now || !runsOn(s as never, d)) continue;
      await Trip.create({ scheduleId: s._id, busId: s.busId, from: s.from, to: s.to, seatPrice: s.seatPrice, departureAt,
        // Left in the last 5 hours: still on the road
        status: now.getTime() - departureAt.getTime() < 5 * 3600000 ? "DEPARTED" : "ARRIVED" });
    }
  }
  await generateAllTrips();

  // Manual trips (no schedule)
  await Trip.create([
    { busId: buses["هـ-122"]._id, from: "DAMASCUS", to: "ALEPPO", seatPrice: 190000, departureAt: localDateTime(addDays(today, 2), "06:30") },
    { busId: buses["أ-214"]._id, from: "DAMASCUS", to: "TARTUS", seatPrice: 60000, departureAt: localDateTime(addDays(today, 1), "15:00") },
  ]);

  // Bookings: past trips and the next 4 days
  const trips = await Trip.find({ departureAt: { $lt: localDateTime(addDays(today, 4), "23:59") } }).populate<{
    busId: { busClass: BusClass; size: BusSize };
  }>("busId", "busClass size");

  let count = 0;
  for (const trip of trips) {
    const total = seatCount(trip.busId.busClass, trip.busId.size);
    const daysAhead = (trip.departureAt.getTime() - now.getTime()) / 86400000;
    const fill = daysAhead > 2 ? 0.15 + rand() * 0.25 : 0.45 + rand() * 0.45;
    const free = Array.from({ length: total }, (_, i) => i + 1).sort(() => rand() - 0.5);
    let target = Math.floor(total * fill);
    const booked: number[] = [];

    while (target > 0 && free.length) {
      const n = Math.min(target, 1 + Math.floor(rand() * 3), free.length);
      const seats = free.splice(0, n).sort((a, b) => a - b);
      target -= n;

      const fromApp = rand() < 0.35;
      const customer = fromApp ? pick(customers) : null;
      const name = customer?.name ?? `${pick(FIRST)} ${pick(LAST)}`;
      const method = fromApp || rand() < 0.4 ? "SHAM_CASH" : "CASH";
      const hoursBefore = 2 + rand() * 24 * 5;
      const createdAt = new Date(Math.min(now.getTime() - 60000, trip.departureAt.getTime() - hoursBefore * 3600000));
      const cancelled = rand() < 0.06;
      const past = trip.status === "ARRIVED"; // DEPARTED trips keep CONFIRMED bookings

      await Booking.create({
        code: newBookingCode(),
        tripId: trip._id,
        customerId: customer?._id ?? null,
        createdBy: fromApp ? null : pick(staff.slice(0, 3))._id,
        customerName: name,
        customerPhone: customer?.phone ?? phone(),
        seats: seats.map((seatNumber, i) => ({ seatNumber, passengerName: i === 0 ? name : `${pick(FIRST)} ${name.split(" ")[1] ?? ""}`.trim() })),
        seatPrice: trip.seatPrice,
        total: trip.seatPrice * seats.length,
        paymentMethod: method,
        paymentRef: method === "SHAM_CASH" ? String(Math.floor(1e8 + rand() * 9e8)) : null,
        channel: fromApp ? "APP" : "RECEPTION",
        status: cancelled ? "CANCELLED" : past ? "COMPLETED" : "CONFIRMED",
        cancelledAt: cancelled ? new Date(createdAt.getTime() + 3600000) : null,
        refundAmount: cancelled ? trip.seatPrice * seats.length : 0,
        refunded: cancelled && rand() < 0.5,
        createdAt,
      });
      if (!cancelled) booked.push(...seats);
      count++;
    }
    trip.bookedSeats = booked;
    await trip.save();
  }

  console.log(`Demo data ready: ${trips.length} trips with bookings, ${count} bookings.`);
  console.log(`Logins (password ${DEMO_PASSWORD}): admin 0900000000, reception 0944120981`);
  await disconnectDB();
}

main().catch(async (e) => {
  console.error(e);
  await disconnectDB();
  process.exit(1);
});
