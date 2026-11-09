import type { BusClass, BusSize } from "@/types/domain";

export interface SeatLayout {
  leftSeats: number;
  rightSeats: number;
  rows: number;
  hasBackMiddleSeat: boolean;
}

const seatLayouts: Record<BusClass, Omit<SeatLayout, "rows">> = {
  REGULAR: { leftSeats: 2, rightSeats: 2, hasBackMiddleSeat: true },
  FIRST_CLASS: { leftSeats: 2, rightSeats: 1, hasBackMiddleSeat: false },
  BUSINESS: { leftSeats: 1, rightSeats: 1, hasBackMiddleSeat: false },
};

export function getSeatLayout(busClass: BusClass, size: BusSize): SeatLayout {
  return {
    ...seatLayouts[busClass],
    rows: size === "LARGE" ? 11 : 9,
  };
}

export function getSeatCount(busClass: BusClass, size: BusSize) {
  const layout = getSeatLayout(busClass, size);
  return (
    layout.rows * (layout.leftSeats + layout.rightSeats) +
    Number(layout.hasBackMiddleSeat)
  );
}
