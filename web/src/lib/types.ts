export type Role = "ADMIN" | "RECEPTIONIST" | "CUSTOMER";
export type BusClass = "REGULAR" | "FIRST_CLASS" | "BUSINESS";
export type BusSize = "LARGE" | "MEDIUM";
export type BusStatus = "ACTIVE" | "MAINTENANCE";
export type TripStatus = "SCHEDULED" | "DEPARTED" | "ARRIVED" | "CANCELLED";
export type BookingStatus = "CONFIRMED" | "COMPLETED" | "CANCELLED";
export type PaymentMethod = "CASH" | "SHAM_CASH";
export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY";

export interface User {
  _id: string;
  name: string;
  phone: string;
  role: Role;
  active: boolean;
}

export interface Session {
  token: string;
  user: User;
}

export interface Bus {
  _id: string;
  plateNumber: string;
  busClass: BusClass;
  size: BusSize;
  status: BusStatus;
  seatCount: number;
}

export interface TripBus {
  _id: string;
  plateNumber: string;
  busClass: BusClass;
  size: BusSize;
}

export interface Trip {
  _id: string;
  scheduleId: string | null;
  from: string;
  to: string;
  seatPrice: number;
  departureAt: string;
  status: TripStatus;
  bookedSeats: number[];
  bus: TripBus | null;
  totalSeats: number;
  availableSeats: number;
}

export interface Schedule {
  _id: string;
  from: string;
  to: string;
  busId: string;
  bus: TripBus | null;
  seatPrice: number;
  departureTime: string;
  frequency: Frequency;
  days: number[];
  startDate: string;
  endDate: string;
  active: boolean;
  upcomingTrips: number;
}

export interface BookingSeat {
  seatNumber: number;
  passengerName: string;
}

export interface Booking {
  _id: string;
  code: string;
  tripId: string;
  customerName: string;
  customerPhone: string;
  seats: BookingSeat[];
  seatPrice: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentRef: string | null;
  channel: "APP" | "RECEPTION";
  status: BookingStatus;
  cancelledAt: string | null;
  refundAmount: number;
  refunded: boolean;
  createdAt: string;
  trip: {
    _id: string;
    from: string;
    to: string;
    departureAt: string;
    status: TripStatus;
    seatPrice: number;
    bus: TripBus | null;
  } | null;
}

export interface Passenger {
  seatNumber: number;
  passengerName: string;
  customerName: string;
  customerPhone: string;
  bookingId: string;
  bookingCode: string;
}

export interface Manifest {
  trip: Trip;
  passengers: Passenger[];
  stats: { booked: number; available: number; total: number };
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface Summary {
  date: string;
  trips: { total: number; departed: number };
  occupancy: { rate: number; change: number };
  revenue: { total: number; changePercent: number | null };
  bookings: { total: number; changePercent: number | null };
}

export interface OccupancyReport {
  rate: number;
  bookedSeats: number;
  totalSeats: number;
  byRoute: { from: string; to: string; trips: number; bookedSeats: number; totalSeats: number; rate: number }[];
}

export interface RevenueReport {
  total: number;
  bookings: number;
  byDay: { date: string; total: number; bookings: number }[];
  byHour?: { hour: number; total: number; bookings: number }[];
}
