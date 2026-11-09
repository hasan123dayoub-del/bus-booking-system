export type Role = "ADMIN" | "RECEPTIONIST" | "CUSTOMER";

export type BusClass = "REGULAR" | "FIRST_CLASS" | "BUSINESS";
export type BusSize = "LARGE" | "MEDIUM";
export type BusStatus = "ACTIVE" | "MAINTENANCE" | "INACTIVE";
export type TripStatus = "SCHEDULED" | "DEPARTED" | "ARRIVED" | "CANCELLED";
export type BookingStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED";
export type PaymentMethod = "CASH" | "SHAM_CASH";
export type ScheduleFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

export interface User {
  _id: string;
  name: string;
  phone: string;
  role: Role;
  active?: boolean;
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
}

export interface Trip {
  _id: string;
  busId: string | Bus;
  scheduleId?: string | null;
  from: string;
  to: string;
  seatPrice: number;
  departureAt: string;
  bookedSeats: number[];
  status: TripStatus;
  bus?: Bus;
}

export interface TripSchedule {
  _id: string;
  from: string;
  to: string;
  busId: string | Bus;
  seatPrice: number;
  departureTime: string;
  frequency: ScheduleFrequency;
  days: number[];
  startDate: string;
  endDate?: string | null;
  active: boolean;
  bus?: Bus;
}

export interface PassengerSeat {
  seatNumber: number;
  passengerName: string;
}

export interface Booking {
  _id: string;
  code: string;
  tripId: string | Trip;
  customerId?: string | User;
  createdBy?: string | User;
  seats: PassengerSeat[];
  seatPrice: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentRef?: string;
  channel?: "APP" | "OFFICE";
  status: BookingStatus;
  customer?: User;
}

export interface City {
  name: string;
  value: string;
}

export interface ReportSummary {
  totalTrips?: number;
  totalSeats?: number;
  bookedSeats?: number;
  occupancyRate?: number;
  totalRevenue?: number;
  confirmedBookings?: number;
}

export interface Manifest {
  trip: Trip;
  bookings: Booking[];
}
