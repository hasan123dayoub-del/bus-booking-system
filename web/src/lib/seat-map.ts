import type { BusClass, BusSize } from "./types";

/** Same rules as the backend's buildSeatMap: numbered front to back, left to right. */
const LAYOUTS: Record<BusClass, { left: number; right: number; backMiddle: boolean }> = {
  REGULAR: { left: 2, right: 2, backMiddle: true },
  FIRST_CLASS: { left: 2, right: 1, backMiddle: false },
  BUSINESS: { left: 1, right: 1, backMiddle: false },
};
const ROWS: Record<BusSize, number> = { LARGE: 11, MEDIUM: 9 };

export interface SeatRow {
  left: number[];
  right: number[];
}

export function seatRows(busClass: BusClass, size: BusSize) {
  const l = LAYOUTS[busClass];
  let n = 0;
  const rows: SeatRow[] = [];
  for (let r = 0; r < ROWS[size]; r++) {
    rows.push({
      left: Array.from({ length: l.left }, () => ++n),
      right: Array.from({ length: l.right }, () => ++n),
    });
  }
  const backMiddle = l.backMiddle ? ++n : null;
  return { rows, backMiddle, total: n };
}

export const seatTotal = (busClass: BusClass, size: BusSize) => seatRows(busClass, size).total;
