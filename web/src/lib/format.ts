import type { BookingStatus, BusClass, BusSize, BusStatus, Frequency, PaymentMethod, TripStatus } from "./types";

export const CITIES: { code: string; name: string }[] = [
  { code: "DAMASCUS", name: "دمشق" },
  { code: "RIF_DIMASHQ", name: "ريف دمشق" },
  { code: "ALEPPO", name: "حلب" },
  { code: "HOMS", name: "حمص" },
  { code: "HAMA", name: "حماة" },
  { code: "LATAKIA", name: "اللاذقية" },
  { code: "TARTUS", name: "طرطوس" },
  { code: "IDLIB", name: "إدلب" },
  { code: "DEIR_EZZOR", name: "دير الزور" },
  { code: "RAQQA", name: "الرقة" },
  { code: "HASAKAH", name: "الحسكة" },
  { code: "DARAA", name: "درعا" },
  { code: "SUWEIDA", name: "السويداء" },
  { code: "QUNEITRA", name: "القنيطرة" },
];
const CITY_NAME = Object.fromEntries(CITIES.map((c) => [c.code, c.name]));
export const cityName = (code: string) => CITY_NAME[code] ?? code;
export const route = (from: string, to: string) => `${cityName(from)} ← ${cityName(to)}`;

export const CLASS_LABEL: Record<BusClass, string> = {
  REGULAR: "عادية",
  FIRST_CLASS: "درجة أولى",
  BUSINESS: "رجال أعمال",
};
export const CLASS_LAYOUT: Record<BusClass, string> = {
  REGULAR: "2+2",
  FIRST_CLASS: "1+2",
  BUSINESS: "1+1",
};
export const SIZE_LABEL: Record<BusSize, string> = { LARGE: "كبير", MEDIUM: "متوسط" };
export const BUS_STATUS_LABEL: Record<BusStatus, string> = { ACTIVE: "فعّال", MAINTENANCE: "صيانة" };
export const TRIP_STATUS_LABEL: Record<TripStatus, string> = {
  SCHEDULED: "مجدولة",
  DEPARTED: "انطلقت",
  ARRIVED: "وصلت",
  CANCELLED: "ملغى",
};
export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  CONFIRMED: "مؤكد",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغى",
};
export const PAYMENT_LABEL: Record<PaymentMethod, string> = { CASH: "نقدًا", SHAM_CASH: "شام كاش" };
export const FREQUENCY_LABEL: Record<Frequency, string> = { DAILY: "يوميًا", WEEKLY: "أسبوعي", MONTHLY: "شهري" };

// Levantine month names, as used in Syria
const MONTHS = [
  "كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران",
  "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول",
];
export const WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
export const WEEKDAY_SHORT = ["الأ", "الا", "الث", "الأ", "الخ", "الج", "الس"];
const WEEKDAY_LIST = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

const OFFSET_MS = 3 * 3600 * 1000; // Damascus is UTC+3 all year

/** Parts of an instant in Damascus time. */
function parts(value: string | Date) {
  const d = new Date(new Date(value).getTime() + OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    day: d.getUTCDate(),
    weekday: d.getUTCDay(),
    hours: d.getUTCHours(),
    minutes: d.getUTCMinutes(),
  };
}

/** Parts of a "YYYY-MM-DD" date. */
function dateParts(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate(), weekday: d.getUTCDay() };
}

/** "06:00 ص" */
export function time12(hours: number, minutes: number) {
  const h = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(h).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "ص" : "م"}`;
}
export const timeOf = (value: string | Date) => {
  const p = parts(value);
  return time12(p.hours, p.minutes);
};
export const timeFromHHmm = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return time12(h, m);
};

/** Today's date in Damascus, "YYYY-MM-DD". */
export const today = () => new Date(Date.now() + OFFSET_MS).toISOString().slice(0, 10);
export function addDays(date: string, n: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const localDateOf = (value: string | Date) =>
  new Date(new Date(value).getTime() + OFFSET_MS).toISOString().slice(0, 10);
export const localTimeOf = (value: string | Date) =>
  new Date(new Date(value).getTime() + OFFSET_MS).toISOString().slice(11, 16);

/** "الجمعة، 6 تشرين الثاني 2026" */
export function longDate(date: string) {
  const p = dateParts(date);
  return `${WEEKDAYS[p.weekday]}، ${p.day} ${MONTHS[p.month]} ${p.year}`;
}
/** "الجمعة 6 تشرين الثاني" */
export function dayMonth(date: string) {
  const p = dateParts(date);
  return `${WEEKDAYS[p.weekday]} ${p.day} ${MONTHS[p.month]}`;
}
/** "6 – 12 تشرين الثاني" (or across months) */
export function dateRange(from: string, to: string) {
  const a = dateParts(from);
  const b = dateParts(to);
  if (from === to) return `${a.day} ${MONTHS[a.month]}`;
  if (a.month === b.month && a.year === b.year) return `${a.day} – ${b.day} ${MONTHS[a.month]}`;
  return `${a.day} ${MONTHS[a.month]} – ${b.day} ${MONTHS[b.month]}`;
}
/** "الجمعة 6/11 · 06:00 ص" */
export function tripWhen(value: string) {
  const p = parts(value);
  return `${WEEKDAYS[p.weekday]} ${p.day}/${p.month + 1} · ${time12(p.hours, p.minutes)}`;
}
/** "1/11" from "YYYY-MM-DD" */
export function shortDate(date: string) {
  const p = dateParts(date);
  return `${p.day}/${p.month + 1}`;
}
export const weekdayOf = (date: string) => WEEKDAYS[dateParts(date).weekday];

/** "85,000 ل.س" */
export const money = (n: number) => `${Math.round(n).toLocaleString("en-US")} ل.س`;
export const number = (n: number) => n.toLocaleString("en-US");

/** +963944123456 -> "09 44 123 456" */
export function phone(value: string) {
  const m = value.match(/^\+963(9)(\d{2})(\d{3})(\d{3})$/);
  return m ? `0${m[1]} ${m[2]} ${m[3]} ${m[4]}` : value;
}

export function frequencyText(frequency: Frequency, days: number[]) {
  if (frequency === "DAILY") return "يوميًا";
  if (frequency === "MONTHLY") return `يوم ${days[0]} من كل شهر`;
  return days.map((d) => WEEKDAY_LIST[d]).join(" · ");
}
