import { BusClass, BusSize } from "../constants";

interface Layout {
  leftSeats: number;
  rightSeats: number;
  hasBackMiddleSeat: boolean;
}

const LAYOUTS: Record<BusClass, Layout> = {
  REGULAR: { leftSeats: 2, rightSeats: 2, hasBackMiddleSeat: true },
  FIRST_CLASS: { leftSeats: 2, rightSeats: 1, hasBackMiddleSeat: false },
  BUSINESS: { leftSeats: 1, rightSeats: 1, hasBackMiddleSeat: false },
};

const ROWS: Record<BusSize, number> = { LARGE: 11, MEDIUM: 9 };

export interface SeatRow {
  row: number;
  left: number[];
  right: number[];
}

export interface SeatMap {
  busClass: BusClass;
  size: BusSize;
  rows: SeatRow[];
  /** REGULAR buses only: the single seat in the middle of the back row */
  backMiddleSeat: number | null;
  totalSeats: number;
}

/** Numbering: front to back, left to right. The back middle seat gets the last number. */
export function buildSeatMap(busClass: BusClass, size: BusSize): SeatMap {
  const { leftSeats, rightSeats, hasBackMiddleSeat } = LAYOUTS[busClass];
  let n = 0;
  const rows: SeatRow[] = [];

  for (let row = 1; row <= ROWS[size]; row++) {
    const left = Array.from({ length: leftSeats }, () => ++n);
    const right = Array.from({ length: rightSeats }, () => ++n);
    rows.push({ row, left, right });
  }

  const backMiddleSeat = hasBackMiddleSeat ? ++n : null;
  return { busClass, size, rows, backMiddleSeat, totalSeats: n };
}

export const seatCount = (busClass: BusClass, size: BusSize): number =>
  buildSeatMap(busClass, size).totalSeats;

export const isValidSeat = (busClass: BusClass, size: BusSize, seat: number): boolean =>
  Number.isInteger(seat) && seat >= 1 && seat <= seatCount(busClass, size);
