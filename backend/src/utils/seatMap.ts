import { BusClass, BusSize, ROWS_BY_SIZE, SEAT_LAYOUTS } from "../constants";

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
  const { leftSeats, rightSeats, hasBackMiddleSeat } = SEAT_LAYOUTS[busClass];
  let n = 0;
  const rows: SeatRow[] = [];

  for (let row = 1; row <= ROWS_BY_SIZE[size]; row++) {
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
