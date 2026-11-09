export const ROLES = ["ADMIN", "RECEPTIONIST", "CUSTOMER"] as const;
export type Role = (typeof ROLES)[number];

export const BUS_CLASSES = ["REGULAR", "FIRST_CLASS", "BUSINESS"] as const;
export type BusClass = (typeof BUS_CLASSES)[number];

export const BUS_SIZES = ["LARGE", "MEDIUM"] as const;
export type BusSize = (typeof BUS_SIZES)[number];

export const BUS_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type BusStatus = (typeof BUS_STATUSES)[number];

export const TRIP_STATUSES = ["SCHEDULED", "DEPARTED", "ARRIVED", "CANCELLED"] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export const BOOKING_STATUSES = ["CONFIRMED", "COMPLETED", "CANCELLED"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_METHODS = ["CASH", "SHAM_CASH"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const BOOKING_CHANNELS = ["APP", "OFFICE"] as const;
export type BookingChannel = (typeof BOOKING_CHANNELS)[number];

export const FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY"] as const;
export type Frequency = (typeof FREQUENCIES)[number];
