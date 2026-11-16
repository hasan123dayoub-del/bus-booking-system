import type { BusClass, BusSize } from './catalog';

// Shapes returned by the backend (backend/src/services/trip.service.ts and booking.service.ts)

export interface TripBus {
  _id: string;
  plateNumber: string;
  busClass: BusClass;
  size: BusSize;
}

export interface Trip {
  _id: string;
  from: string;
  to: string;
  seatPrice: number;
  departureAt: string;
  status: string;
  bookedSeats: number[];
  bus: TripBus | null;
  totalSeats: number;
  availableSeats: number;
}

export interface SeatMap {
  busClass: BusClass;
  size: BusSize;
  rows: { row: number; left: number[]; right: number[] }[];
  backMiddleSeat: number | null;
  totalSeats: number;
}

export interface TripDetail extends Trip {
  seatMap: SeatMap | null;
}

export type BookingStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface Booking {
  _id: string;
  code: string;
  seats: { seatNumber: number; passengerName: string }[];
  seatPrice: number;
  total: number;
  paymentMethod: 'CASH' | 'SHAM_CASH';
  paymentRef: string | null;
  status: BookingStatus;
  trip: {
    _id: string;
    from: string;
    to: string;
    departureAt: string;
    status: string;
    seatPrice: number;
    bus: { busClass: BusClass; size: BusSize } | null;
  } | null;
  // Only on GET /me/bookings
  canCancel?: boolean;
  refundIfCancelled?: number;
}
