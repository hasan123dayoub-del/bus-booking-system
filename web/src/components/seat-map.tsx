"use client";

import { Icon } from "./icon";
import { seatRows } from "@/lib/seat-map";
import type { BusClass, BusSize } from "@/lib/types";

/**
 * Bus seat map. Drawn left to right whatever the page direction:
 * the driver sits front left, the door is front right.
 */
export function SeatMap({
  busClass,
  size,
  booked = [],
  selected = [],
  onToggle,
  small,
}: {
  busClass: BusClass;
  size: BusSize;
  booked?: number[];
  selected?: number[];
  onToggle?: (seat: number) => void;
  small?: boolean;
}) {
  const { rows, backMiddle } = seatRows(busClass, size);
  const bookedSet = new Set(booked);
  const selectedSet = new Set(selected);

  const seat = (n: number) => {
    const isBooked = bookedSet.has(n);
    const isSelected = selectedSet.has(n);
    const state = isBooked ? "booked" : isSelected ? "selected" : "free";
    const label = `مقعد ${n}، ${isBooked ? "محجوز" : isSelected ? "محدد" : "متاح"}`;
    if (!onToggle) {
      return (
        <span key={n} className={`seat ${state}`} aria-label={label}>
          {isBooked ? <Icon name="x" size={small ? 10 : 14} /> : n}
        </span>
      );
    }
    return (
      <button
        key={n}
        type="button"
        className={`seat ${state}`}
        disabled={isBooked}
        aria-pressed={isSelected}
        aria-label={label}
        onClick={() => onToggle(n)}
      >
        {isBooked ? <Icon name="x" size={14} /> : n}
      </button>
    );
  };

  return (
    <div className={`bus${small ? " small" : ""}`} dir="ltr">
      <div className="bus-front">
        <Icon name="wheel" size={small ? 14 : 20} className="bus-wheel" />
        <Icon name="door" size={small ? 13 : 18} className="bus-door" />
      </div>
      {rows.map((r, i) => (
        <div className="bus-row" key={i}>
          <div className="bus-side">{r.left.map(seat)}</div>
          {/* REGULAR buses: the back row has one more seat in the aisle */}
          {backMiddle && i === rows.length - 1 && seat(backMiddle)}
          <div className="bus-side">{r.right.map(seat)}</div>
        </div>
      ))}
    </div>
  );
}

export function SeatLegend() {
  return (
    <div className="seat-legend">
      <span><i className="seat-dot free" />متاح</span>
      <span><i className="seat-dot booked" />محجوز</span>
      <span><i className="seat-dot selected" />محدد</span>
    </div>
  );
}
