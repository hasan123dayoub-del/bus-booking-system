import type {
  BookingStatus,
  BusClass,
  BusSize,
  BusStatus,
  PaymentMethod,
  TripStatus,
} from "@/types/domain";

const dateFormatter = new Intl.DateTimeFormat("ar-SY", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("ar-SY", {
    style: "currency",
    currency: "SYP",
    maximumFractionDigits: 0,
  }).format(value);
}

export const busClassLabels: Record<BusClass, string> = {
  REGULAR: "عادية",
  FIRST_CLASS: "درجة أولى",
  BUSINESS: "رجال أعمال",
};

export const busSizeLabels: Record<BusSize, string> = {
  LARGE: "كبير · 11 صفاً",
  MEDIUM: "متوسط · 9 صفوف",
};

export const busStatusLabels: Record<BusStatus, string> = {
  ACTIVE: "متاح",
  MAINTENANCE: "صيانة",
  INACTIVE: "متوقف",
};

export const tripStatusLabels: Record<TripStatus, string> = {
  SCHEDULED: "مجدولة",
  DEPARTED: "انطلقت",
  ARRIVED: "وصلت",
  CANCELLED: "ملغاة",
};

export const bookingStatusLabels: Record<BookingStatus, string> = {
  CONFIRMED: "مؤكد",
  CANCELLED: "ملغى",
  COMPLETED: "مكتمل",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "نقداً",
  SHAM_CASH: "شام كاش",
};

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "حدث خطأ غير متوقع";
}
