import { BUS_CLASSES, BUS_SIZES, BusClass, BusSize } from "./enums";

export const BUS_CLASS_NAMES_AR: Record<BusClass, string> = {
  REGULAR: "عادية",
  FIRST_CLASS: "درجة أولى",
  BUSINESS: "رجال أعمال",
};

export const BUS_SIZE_NAMES_AR: Record<BusSize, string> = {
  LARGE: "كبير",
  MEDIUM: "متوسط",
};

export interface SeatLayout {
  leftSeats: number;
  rightSeats: number;
  hasBackMiddleSeat: boolean;
}

export const SEAT_LAYOUTS: Record<BusClass, SeatLayout> = {
  REGULAR: { leftSeats: 2, rightSeats: 2, hasBackMiddleSeat: true },
  FIRST_CLASS: { leftSeats: 2, rightSeats: 1, hasBackMiddleSeat: false },
  BUSINESS: { leftSeats: 1, rightSeats: 1, hasBackMiddleSeat: false },
};

export const ROWS_BY_SIZE: Record<BusSize, number> = { LARGE: 11, MEDIUM: 9 };

/** The 6 fixed bus types (3 classes x 2 sizes). */
export const BUS_TYPES = BUS_CLASSES.flatMap((busClass) =>
  BUS_SIZES.map((size) => {
    const layout = SEAT_LAYOUTS[busClass];
    const rows = ROWS_BY_SIZE[size];
    return {
      busClass,
      size,
      nameAr: `${BUS_CLASS_NAMES_AR[busClass]} · ${BUS_SIZE_NAMES_AR[size]}`,
      rows,
      ...layout,
      seatCount: rows * (layout.leftSeats + layout.rightSeats) + (layout.hasBackMiddleSeat ? 1 : 0),
    };
  }),
);
