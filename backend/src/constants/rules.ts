/** Business rules. Values the company owner may still change. */

/** A customer can cancel from the app until this many hours before departure. */
export const CANCEL_DEADLINE_HOURS = 2;

/** Share of the booking total returned on cancellation. */
export const REFUND_PERCENT = 100;

/** Schedules keep this many days of trips generated ahead. */
export const SCHEDULE_DAYS_AHEAD = 30;

/** Syria is UTC+3 all year (no daylight saving since 2022). */
export const UTC_OFFSET = "+03:00";

/** Maximum seats in a single booking. */
export const MAX_SEATS_PER_BOOKING = 10;
