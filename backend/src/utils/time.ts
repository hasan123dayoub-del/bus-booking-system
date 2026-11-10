import { UTC_OFFSET } from "../constants";

const DAY_MS = 24 * 60 * 60 * 1000;
const OFFSET_MS = 3 * 60 * 60 * 1000; // matches UTC_OFFSET (+03:00)

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** "2026-11-06" + "08:30" (Damascus time) -> Date */
export function localDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00${UTC_OFFSET}`);
}

/** Start and end (exclusive) of a Damascus calendar day. */
export function dayRange(date: string): { start: Date; end: Date } {
  const start = localDateTime(date, "00:00");
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

/** Range covering the days from `from` to `to` (both inclusive). */
export function daysRange(from: string, to: string): { start: Date; end: Date } {
  return { start: dayRange(from).start, end: dayRange(to).end };
}

/** Damascus calendar date of an instant, as "YYYY-MM-DD". */
export function localDate(at: Date = new Date()): string {
  return new Date(at.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" plus n days. */
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Weekday (0 = Sunday) and day of month of a "YYYY-MM-DD" date. */
export function dateParts(date: string): { weekday: number; monthDay: number; lastDayOfMonth: number } {
  const d = new Date(`${date}T12:00:00Z`);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  return { weekday: d.getUTCDay(), monthDay: d.getUTCDate(), lastDayOfMonth: last };
}
