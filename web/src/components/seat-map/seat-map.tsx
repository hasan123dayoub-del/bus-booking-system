"use client";

import { getSeatLayout } from "@/lib/seat-map";
import type { BusClass, BusSize } from "@/types/domain";

export function SeatMap({
  busClass,
  size,
  bookedSeats,
  selectedSeats,
  onToggle,
  disabled = false,
}: {
  busClass: BusClass;
  size: BusSize;
  bookedSeats: number[];
  selectedSeats: number[];
  onToggle: (seatNumber: number) => void;
  disabled?: boolean;
}) {
  const layout = getSeatLayout(busClass, size);
  let seatNumber = 1;

  function seatButton(number: number) {
    const booked = bookedSeats.includes(number);
    const selected = selectedSeats.includes(number);
    return (
      <button
        key={number}
        type="button"
        className={`seat${selected ? " selected" : ""}${booked ? " booked" : ""}`}
        disabled={booked || disabled}
        onClick={() => onToggle(number)}
        aria-label={`المقعد ${number}${booked ? " محجوز" : selected ? " محدد" : " متاح"}`}
        aria-pressed={selected}
      >
        {number}
      </button>
    );
  }

  const rows = Array.from({ length: layout.rows }, (_, row) => {
    const left = Array.from({ length: layout.leftSeats }, () => seatNumber++);
    const right = Array.from({ length: layout.rightSeats }, () => seatNumber++);
    return (
      <div className="seat-row" key={row}>
        {left.map(seatButton)}
        <span className="seat-aisle" aria-hidden="true" />
        {right.map(seatButton)}
      </div>
    );
  });

  return (
    <div>
      <div className="seat-map" aria-label="مخطط مقاعد الحافلة">
        <span className="muted-note">مقدمة الحافلة</span>
        {rows}
        {layout.hasBackMiddleSeat && (
          <div className="seat-back-row">{seatButton(seatNumber)}</div>
        )}
      </div>
      <div className="legend" aria-label="دليل المقاعد">
        <span className="legend-item"><i className="legend-swatch" />متاح</span>
        <span className="legend-item"><i className="legend-swatch selected" />محدد</span>
        <span className="legend-item"><i className="legend-swatch booked" />محجوز</span>
      </div>
    </div>
  );
}
