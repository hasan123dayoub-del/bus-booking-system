"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { SeatLegend, SeatMap } from "@/components/seat-map";
import {
  Alert,
  Chips,
  ClassBadge,
  DateInput,
  Empty,
  Loading,
  Modal,
  PageHeader,
  Pill,
  RowMenu,
  type PillTone,
} from "@/components/ui";
import { api, errorMessage, qs } from "@/lib/api";
import {
  BOOKING_STATUS_LABEL,
  PAYMENT_LABEL,
  dayMonth,
  money,
  number,
  phone as formatPhone,
  route,
  timeOf,
  today,
  localDateOf,
} from "@/lib/format";
import type { Booking, BookingStatus, Manifest, PageMeta } from "@/lib/types";

const LIMIT = 7;
type Filter = "ALL" | "CONFIRMED" | "CANCELLED" | "REFUND";
const STATUS_TONE: Record<BookingStatus, PillTone> = { CONFIRMED: "green", CANCELLED: "red", COMPLETED: "gray" };

const canChange = (b: Booking) =>
  b.status === "CONFIRMED" && b.trip?.status === "SCHEDULED" && new Date(b.trip.departureAt) > new Date();

export default function BookingsPage() {
  const [q, setQ] = useState("");
  const [query, setQuery] = useState(""); // debounced
  const [date, setDate] = useState(today);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Booking[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [changing, setChanging] = useState<{ booking: Booking; seat: number; manifest: Manifest } | null>(null);
  const [newSeat, setNewSeat] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.page<Booking>(
        `/staff/bookings${qs({
          q: query,
          date,
          status: filter === "ALL" ? "" : filter === "REFUND" ? "CANCELLED" : filter,
          refunded: filter === "REFUND" ? "false" : "",
          page,
          limit: LIMIT,
        })}`,
      );
      setRows(res.data);
      setMeta(res.meta);
      setSelectedId((id) => (res.data.some((b) => b._id === id) ? id : (res.data[0]?._id ?? "")));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [query, date, filter, page]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const selected = rows.find((b) => b._id === selectedId) ?? null;
  const tripId = selected?.tripId ?? "";

  const loadManifest = useCallback(async (id: string) => {
    if (!id) return setManifest(null);
    try {
      setManifest(await api.get<Manifest>(`/staff/trips/${id}/manifest`));
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setShowAll(false);
      void loadManifest(tripId);
    }, 0);
    return () => clearTimeout(t);
  }, [tripId, loadManifest]);

  const resetPage = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await action();
      setSuccess(message);
      await Promise.all([load(), loadManifest(tripId)]);
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function openChange(b: Booking) {
    try {
      const m = await api.get<Manifest>(`/staff/trips/${b.tripId}/manifest`);
      setNewSeat(null);
      setChanging({ booking: b, seat: b.seats[0].seatNumber, manifest: m });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const passengers = manifest?.passengers ?? [];
  const firstSeatOf = new Set(
    Object.values(
      passengers.reduce<Record<string, number>>((acc, p) => {
        acc[p.bookingId] = Math.min(acc[p.bookingId] ?? Infinity, p.seatNumber);
        return acc;
      }, {}),
    ),
  );
  const shown = showAll ? passengers : passengers.slice(0, 5);
  const fromRow = meta && meta.total ? (meta.page - 1) * meta.limit + 1 : 0;
  const toRow = meta ? Math.min(meta.total, meta.page * meta.limit) : 0;

  return (
    <>
      <PageHeader title="الحجوزات" subtitle="كل حجوزات الشركة · اضغط على حجز لعرض قائمة ركاب رحلته" />

      <div className="card filter-bar">
        <span className="input-wrap search">
          <Icon name="search" size={18} className="input-icon" />
          <input placeholder="ابحث برمز الحجز أو اسم الزبون أو الهاتف" value={q} onChange={(e) => resetPage(setQ)(e.target.value)} />
        </span>
        <span className="date-pill-wrap">
          <DateInput
            className="date-pill"
            value={date}
            onChange={resetPage(setDate)}
            format={(d) => (d === today() ? "اليوم" : dayMonth(d))}
          />
          {date ? (
            <button type="button" className="clear-date" onClick={() => resetPage(setDate)("")} aria-label="كل الأيام" title="كل الأيام">
              <Icon name="x" size={12} />
            </button>
          ) : null}
        </span>
        <Chips
          value={filter}
          onChange={resetPage(setFilter)}
          options={[
            { value: "ALL", label: "الكل" },
            { value: "CONFIRMED", label: "مؤكد" },
            { value: "CANCELLED", label: "ملغى" },
            { value: "REFUND", label: "بانتظار الاسترداد" },
          ]}
        />
      </div>

      {error && <Alert onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert tone="success" onClose={() => setSuccess("")}>{success}</Alert>}

      <div className="split split-wide">
        <section className="card table-card">
          {loading && !rows.length ? (
            <Loading />
          ) : !rows.length ? (
            <Empty icon="ticket" title="لا توجد حجوزات" text="غيّر البحث أو التاريخ أو الحالة." />
          ) : (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>رمز الحجز</th>
                    <th>الزبون</th>
                    <th>الرحلة</th>
                    <th>المقاعد</th>
                    <th>الدفع</th>
                    <th>الحالة</th>
                    <th aria-label="إجراءات" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((b) => (
                    <tr
                      key={b._id}
                      className={b._id === selectedId ? "selected" : ""}
                      onClick={() => setSelectedId(b._id)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedId(b._id)}
                    >
                      <td className="code">{b.code}</td>
                      <td className="strong">{b.customerName}</td>
                      <td className="muted small">
                        {b.trip ? `${route(b.trip.from, b.trip.to)} · ${timeOf(b.trip.departureAt)}` : "—"}
                        {b.trip && date === "" && <span className="sub">{dayMonth(localDateOf(b.trip.departureAt))}</span>}
                      </td>
                      <td dir="ltr" className="seats-cell">{b.seats.map((s) => s.seatNumber).join(", ")}</td>
                      <td>{PAYMENT_LABEL[b.paymentMethod]}</td>
                      <td>
                        <Pill tone={STATUS_TONE[b.status]}>{BOOKING_STATUS_LABEL[b.status]}</Pill>
                        {b.status === "CANCELLED" && (
                          <span className={`sub ${b.refunded ? "" : "warn"}`}>{b.refunded ? "تم الاسترداد" : "بانتظار الاسترداد"}</span>
                        )}
                      </td>
                      <td className="actions">
                        <RowMenu
                          items={[
                            { label: "تغيير المقعد", icon: "seat", onClick: () => void openChange(b), hidden: !canChange(b) },
                            { label: "إلغاء الحجز", icon: "x", danger: true, onClick: () => setCancelling(b), hidden: !canChange(b) },
                            {
                              label: `تسجيل الاسترداد (${money(b.refundAmount)})`,
                              icon: "refund",
                              hidden: !(b.status === "CANCELLED" && !b.refunded),
                              onClick: () =>
                                void run(
                                  () => api.patch(`/staff/bookings/${b._id}/refund`),
                                  `سُجّل استرداد ${money(b.refundAmount)} للحجز ${b.code}.`,
                                ),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {meta && meta.total > 0 && (
            <div className="pager">
              <span className="muted small">
                عرض {number(fromRow)}–{number(toRow)} من {number(meta.total)} حجزًا
              </span>
              <div className="pages">
                {pageNumbers(meta.page, meta.pages).map((p, i) =>
                  p === 0 ? (
                    <span key={`gap${i}`} className="gap">…</span>
                  ) : (
                    <button key={p} type="button" className={p === meta.page ? "active" : ""} onClick={() => setPage(p)}>
                      {p}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}
        </section>

        <aside className="card panel manifest">
          <h2>قائمة ركاب الرحلة</h2>
          {!selected || !manifest ? (
            <Empty icon="list" title="اختر حجزًا" text="تظهر هنا قائمة ركاب رحلة الحجز المختار." />
          ) : (
            <>
              <div className="manifest-trip">
                <strong>{route(manifest.trip.from, manifest.trip.to)}</strong>
                <span className="muted small">
                  {dayMonth(localDateOf(manifest.trip.departureAt))} · {timeOf(manifest.trip.departureAt)}
                </span>
                {manifest.trip.bus && (
                  <span className="manifest-bus">
                    <ClassBadge value={manifest.trip.bus.busClass} />
                    <span className="small">باص {manifest.trip.bus.plateNumber}</span>
                  </span>
                )}
              </div>
              <div className="stat-boxes">
                <div><b>{number(manifest.stats.booked)}</b><span>المحجوز</span></div>
                <div><b>{number(manifest.stats.available)}</b><span>المتاح</span></div>
                <div><b>{number(manifest.stats.total)}</b><span>الإجمالي</span></div>
              </div>
              {passengers.length ? (
                <ul className="passengers">
                  {shown.map((p) => (
                    <li key={p.seatNumber}>
                      <span className="seat-no">{p.seatNumber}</span>
                      <span className="passenger">
                        <strong>{p.passengerName}</strong>
                        <span className="muted small" dir="ltr">
                          {firstSeatOf.has(p.seatNumber) ? formatPhone(p.customerPhone) : "—"}
                        </span>
                      </span>
                      <i className="dot" />
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty title="لا يوجد ركاب بعد" />
              )}
              {passengers.length > 5 && (
                <button type="button" className="link-btn" onClick={() => setShowAll(!showAll)}>
                  {showAll ? "عرض أقل" : `عرض كل الركاب (${number(passengers.length)})`}
                </button>
              )}
            </>
          )}
        </aside>
      </div>

      {changing && changing.manifest.trip.bus && (
        <Modal
          title={`تغيير مقعد في الحجز ${changing.booking.code}`}
          subtitle="اختر المقعد الحالي ثم المقعد الجديد من المخطط"
          onClose={() => setChanging(null)}
          wide
        >
          <div className="change-seat">
            <div className="field">
              <span className="field-label">المقعد الحالي</span>
              <div className="seat-tags">
                {changing.booking.seats.map((s) => (
                  <button
                    key={s.seatNumber}
                    type="button"
                    className={`seat-tag btn-tag${changing.seat === s.seatNumber ? " active" : ""}`}
                    onClick={() => setChanging({ ...changing, seat: s.seatNumber })}
                  >
                    مقعد {s.seatNumber} · {s.passengerName}
                  </button>
                ))}
              </div>
            </div>
            <SeatLegend />
            <SeatMap
              busClass={changing.manifest.trip.bus.busClass}
              size={changing.manifest.trip.bus.size}
              booked={changing.manifest.trip.bookedSeats}
              selected={newSeat ? [newSeat] : []}
              onToggle={(n) => setNewSeat(n === newSeat ? null : n)}
            />
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy || !newSeat}
              onClick={async () => {
                const ok = await run(
                  () =>
                    api.patch(`/staff/bookings/${changing.booking._id}/change-seat`, {
                      seatNumber: changing.seat,
                      newSeatNumber: newSeat,
                    }),
                  `نُقل الراكب من المقعد ${changing.seat} إلى المقعد ${newSeat}.`,
                );
                if (ok) setChanging(null);
              }}
            >
              <Icon name="check" size={18} />
              تأكيد التغيير
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setChanging(null)}>
              إلغاء
            </button>
          </div>
        </Modal>
      )}

      {cancelling && (
        <Modal title={`إلغاء الحجز ${cancelling.code}`} subtitle="تعود المقاعد متاحة للحجز فورًا" onClose={() => setCancelling(null)}>
          <div className="confirm-box">
            <div><span className="muted">الزبون</span><strong>{cancelling.customerName}</strong></div>
            <div><span className="muted">المقاعد</span><strong dir="ltr">{cancelling.seats.map((s) => s.seatNumber).join(", ")}</strong></div>
            <div><span className="muted">المبلغ المسترد</span><strong>{money(cancelling.total)}</strong></div>
          </div>
          <p className="muted small">بعد ردّ المبلغ للزبون (نقدًا أو شام كاش)، سجّل الاسترداد من قائمة «بانتظار الاسترداد».</p>
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-danger"
              disabled={busy}
              onClick={async () => {
                const ok = await run(
                  () => api.post(`/staff/bookings/${cancelling._id}/cancel`),
                  `أُلغي الحجز ${cancelling.code}.`,
                );
                if (ok) setCancelling(null);
              }}
            >
              تأكيد الإلغاء
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setCancelling(null)}>
              تراجع
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

/** 1 2 3 … 9 style page list (0 = gap). */
function pageNumbers(current: number, pages: number) {
  if (pages <= 5) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, pages, current - 1, current, current + 1].filter((p) => p >= 1 && p <= pages));
  const sorted = [...set].sort((a, b) => a - b);
  const out: number[] = [];
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push(0);
    out.push(p);
  });
  return out;
}
