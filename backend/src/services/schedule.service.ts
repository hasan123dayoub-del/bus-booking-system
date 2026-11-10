import { Types } from "mongoose";
import { Frequency, SCHEDULE_DAYS_AHEAD } from "../constants";
import { Bus, Trip, TripSchedule } from "../models";
import { AppError } from "../utils/AppError";
import { addDays, dateParts, localDate, localDateTime } from "../utils/time";
import { requireActiveBus } from "./bus.service";

interface ScheduleInput {
  from: string;
  to: string;
  busId: string;
  seatPrice: number;
  departureTime: string;
  frequency: Frequency;
  days: number[];
  startDate: string;
  endDate: string;
  active: boolean;
}

type ScheduleDoc = InstanceType<typeof TripSchedule>;

/** Does the schedule run on this date? A monthly day past the month's end runs on its last day. */
export function runsOn(s: Pick<ScheduleInput, "frequency" | "days">, date: string): boolean {
  const { weekday, monthDay, lastDayOfMonth } = dateParts(date);
  if (s.frequency === "DAILY") return true;
  if (s.frequency === "WEEKLY") return s.days.includes(weekday);
  const day = s.days[0];
  return monthDay === Math.min(day, lastDayOfMonth);
}

/**
 * Creates the schedule's missing trips from today up to SCHEDULE_DAYS_AHEAD days.
 * Safe to run any number of times: the unique index (scheduleId + departureAt) skips existing trips.
 */
export async function generateTrips(schedule: ScheduleDoc): Promise<number> {
  if (!schedule.active) return 0;
  const bus = await Bus.findById(schedule.busId);
  if (!bus || bus.status !== "ACTIVE") return 0;

  const today = localDate();
  const first = schedule.startDate > today ? schedule.startDate : today;
  const horizon = addDays(today, SCHEDULE_DAYS_AHEAD);
  const last = schedule.endDate < horizon ? schedule.endDate : horizon;
  const now = new Date();

  const docs = [];
  for (let date = first; date <= last; date = addDays(date, 1)) {
    if (!runsOn(schedule as unknown as ScheduleInput, date)) continue;
    const departureAt = localDateTime(date, schedule.departureTime);
    if (departureAt <= now) continue;
    docs.push({
      scheduleId: schedule._id,
      busId: schedule.busId,
      from: schedule.from,
      to: schedule.to,
      seatPrice: schedule.seatPrice,
      departureAt,
    });
  }
  if (!docs.length) return 0;

  try {
    const inserted = await Trip.insertMany(docs, { ordered: false });
    return inserted.length;
  } catch (err) {
    // Duplicates (already generated) are expected; anything else is a real error.
    const e = err as { code?: number; insertedDocs?: unknown[]; writeErrors?: { code: number }[] };
    const onlyDuplicates = (e.writeErrors ?? []).every((w) => w.code === 11000) || e.code === 11000;
    if (!onlyDuplicates) throw err;
    return e.insertedDocs?.length ?? 0;
  }
}

/** Cron entry point: keep every active schedule filled 30 days ahead. */
export async function generateAllTrips(): Promise<number> {
  const today = localDate();
  const schedules = await TripSchedule.find({ active: true, endDate: { $gte: today } });
  let total = 0;
  for (const s of schedules) total += await generateTrips(s);
  return total;
}

/** Removes the schedule's future trips that nobody booked (used before regenerating or on delete). */
async function removeUnbookedFutureTrips(scheduleId: Types.ObjectId) {
  await Trip.deleteMany({
    scheduleId,
    status: "SCHEDULED",
    departureAt: { $gt: new Date() },
    bookedSeats: { $size: 0 },
  });
}

const view = async (s: ScheduleDoc) => {
  const bus = await Bus.findById(s.busId).select("plateNumber busClass size").lean();
  const upcomingTrips = await Trip.countDocuments({
    scheduleId: s._id,
    status: "SCHEDULED",
    departureAt: { $gt: new Date() },
  });
  return { ...s.toJSON(), bus, upcomingTrips };
};

export async function listSchedules() {
  const schedules = await TripSchedule.find().sort({ active: -1, createdAt: -1 });
  return Promise.all(schedules.map(view));
}

export async function createSchedule(input: ScheduleInput) {
  await requireActiveBus(input.busId);
  const schedule = await TripSchedule.create(input);
  await generateTrips(schedule);
  return view(schedule);
}

/**
 * Trips that already have bookings are left untouched; the other future trips are rebuilt
 * from the new schedule.
 */
export async function updateSchedule(id: string, input: ScheduleInput) {
  const schedule = await TripSchedule.findById(id);
  if (!schedule) throw new AppError(404, "SCHEDULE_NOT_FOUND", "الجدول غير موجود");
  if (input.busId !== String(schedule.busId)) await requireActiveBus(input.busId);

  schedule.set(input);
  await schedule.save();
  await removeUnbookedFutureTrips(schedule._id);
  await generateTrips(schedule);
  return view(schedule);
}

export async function deleteSchedule(id: string) {
  const schedule = await TripSchedule.findById(id);
  if (!schedule) throw new AppError(404, "SCHEDULE_NOT_FOUND", "الجدول غير موجود");
  await removeUnbookedFutureTrips(schedule._id);
  await schedule.deleteOne();
}
