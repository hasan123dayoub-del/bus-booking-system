const MONTHS = [
  'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
  'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول',
];
const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const dayName = (d: Date) => DAYS[d.getDay()];

/** "الجمعة 6 تشرين الثاني" */
export const longDate = (d: Date) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;

/** "6 تشرين الثاني" */
export const shortDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;

/** "08:30 ص" */
export function time12(d: Date) {
  const h = d.getHours();
  const hh = String(h % 12 === 0 ? 12 : h % 12).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} ${h < 12 ? 'ص' : 'م'}`;
}

/** "240,000 ل.س" */
export const price = (n: number) => `${n.toLocaleString('en-US')} ل.س`;

/** YYYY-MM-DD in local time, the format the API expects */
export function isoDate(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseIsoDate(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const isSameDay = (a: Date, b: Date) => isoDate(a) === isoDate(b);

/** "سعر × عدد" with the right Arabic word for seats: مقعد / مقعدان / مقاعد */
export function seatsCount(n: number) {
  if (n === 1) return 'مقعد واحد';
  if (n === 2) return 'مقعدان';
  if (n <= 10) return `${n} مقاعد`;
  return `${n} مقعد`;
}
