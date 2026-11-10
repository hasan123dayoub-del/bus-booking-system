"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Icon } from "@/components/icon";
import { SeatLegend, SeatMap } from "@/components/seat-map";
import { Alert, CitySelect, ClassBadge, DateInput, Empty, Field, Loading, PageHeader, Segmented } from "@/components/ui";
import { ApiError, api, errorMessage, qs } from "@/lib/api";
import { CITIES, CLASS_LABEL, CLASS_LAYOUT, dayMonth, money, number, route, timeOf, today } from "@/lib/format";
import type { Booking, PaymentMethod, Trip } from "@/lib/types";

const bookable = (t: Trip) => t.status === "SCHEDULED" && new Date(t.departureAt) > new Date();

export default function BookingPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(today);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [tripId, setTripId] = useState("");
  const [seats, setSeats] = useState<number[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [received, setReceived] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const search = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = (await api.get<Trip[]>(`/staff/trips${qs({ date, from, to })}`)).filter(bookable);
      setTrips(rows);
      setTripId((current) => (rows.some((t) => t._id === current) ? current : (rows[0]?._id ?? "")));
    } catch (err) {
      setError(errorMessage(err));
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [date, from, to]);

  // First load: today's trips from every city
  useEffect(() => {
    const t = setTimeout(() => void search(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trip = useMemo(() => trips.find((t) => t._id === tripId) ?? null, [trips, tripId]);

  function pickTrip(id: string) {
    setTripId(id);
    setSeats([]);
  }

  function toggleSeat(n: number) {
    setSeats((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n].sort((a, b) => a - b)));
  }

  async function refreshTrip(id: string) {
    const fresh = await api.get<Trip>(`/trips/${id}`);
    setTrips((list) => list.map((t) => (t._id === id ? { ...t, ...fresh } : t)));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!trip || !seats.length) return setError("اختر رحلة ومقعدًا واحدًا على الأقل.");
    if (method === "CASH" && !received) return setError("أكّد استلام المبلغ نقدًا قبل تثبيت الحجز.");
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const booking = await api.post<Booking>("/staff/bookings", {
        tripId: trip._id,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        seats: seats.map((seatNumber) => ({ seatNumber })),
        paymentMethod: method,
        ...(method === "SHAM_CASH" ? { paymentRef: paymentRef.trim() } : {}),
      });
      setSuccess(`تم الحجز وتأكيده. رمز الحجز ${booking.code} · المقاعد ${booking.seats.map((s) => s.seatNumber).join("، ")}`);
      setSeats([]);
      setName("");
      setPhone("");
      setPaymentRef("");
      setReceived(false);
      await refreshTrip(trip._id);
    } catch (err) {
      setError(errorMessage(err));
      // Someone else took a seat: reload the map and drop the taken seats
      if (err instanceof ApiError && err.status === 409) {
        await refreshTrip(trip._id);
        setSeats([]);
      }
    } finally {
      setBusy(false);
    }
  }

  const total = (trip?.seatPrice ?? 0) * seats.length;
  const available = trip ? trip.availableSeats : 0;

  return (
    <>
      <PageHeader title="حجز جديد من المكتب" subtitle="ابحث عن رحلة، اختر المقاعد، وأكمل بيانات الزبون" />

      <form
        className="card search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <label className="field">
          <span className="field-label">من</span>
          <CitySelect value={from} onChange={setFrom} icon="origin" placeholder="كل المدن" options={CITIES} />
        </label>
        <label className="field">
          <span className="field-label">إلى</span>
          <CitySelect value={to} onChange={setTo} icon="pin" placeholder="كل المدن" options={CITIES} />
        </label>
        <label className="field">
          <span className="field-label">التاريخ</span>
          <DateInput value={date} onChange={setDate} format={dayMonth} min={today()} />
        </label>
        <button className="btn btn-primary btn-search" disabled={loading}>
          <Icon name="search" size={20} />
          بحث
        </button>
      </form>

      {error && <Alert onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert tone="success" onClose={() => setSuccess("")}>{success}</Alert>}

      <div className="booking-grid">
        <section className="card panel">
          <div className="panel-head">
            <h2>الرحلات المتاحة</h2>
            <span className="muted small">{number(trips.length)} رحلات</span>
          </div>
          {loading ? (
            <Loading />
          ) : !trips.length ? (
            <Empty icon="route" title="لا توجد رحلات متاحة" text="غيّر المدينة أو التاريخ ثم ابحث مجددًا." />
          ) : (
            <div className="trip-list">
              {trips.map((t) => (
                <button
                  type="button"
                  key={t._id}
                  className={`trip-card${t._id === tripId ? " selected" : ""}`}
                  onClick={() => pickTrip(t._id)}
                >
                  <span className="trip-card-main">
                    <strong className="trip-time">{timeOf(t.departureAt)}</strong>
                    {!from || !to ? <span className="trip-route">{route(t.from, t.to)}</span> : null}
                    {t.bus && <ClassBadge value={t.bus.busClass} />}
                  </span>
                  <span className="trip-card-side">
                    <strong className="price">{money(t.seatPrice)}</strong>
                    <span className="muted small">{number(t.availableSeats)} مقعد متاح</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="card panel seat-panel">
          <div className="panel-head column">
            <h2>مخطط المقاعد</h2>
            {trip?.bus && (
              <span className="muted small">
                {route(trip.from, trip.to)} · {timeOf(trip.departureAt)} · {CLASS_LABEL[trip.bus.busClass]} (<bdi dir="ltr">{CLASS_LAYOUT[trip.bus.busClass]}</bdi>)
              </span>
            )}
          </div>
          {trip?.bus ? (
            <>
              <SeatLegend />
              <SeatMap
                busClass={trip.bus.busClass}
                size={trip.bus.size}
                booked={trip.bookedSeats}
                selected={seats}
                onToggle={toggleSeat}
              />
              <div className="seat-counts">
                <span>المتاح <b>{number(available - seats.length)}</b></span>
                <span>المحجوز <b>{number(trip.bookedSeats.length)}</b></span>
                <span>المحدد <b>{number(seats.length)}</b></span>
              </div>
            </>
          ) : (
            <Empty icon="seat" title="اختر رحلة" text="يظهر مخطط المقاعد بعد اختيار رحلة من القائمة." />
          )}
        </section>

        <form className="card panel quick-form" onSubmit={submit}>
          <div className="panel-head">
            <h2>حجز سريع</h2>
          </div>
          <div className="selection-box">
            <div className="selection-row">
              <span className="muted small">المقاعد المختارة</span>
              <span className="seat-tags">
                {seats.length ? (
                  seats.map((s) => (
                    <span key={s} className="seat-tag">
                      مقعد {s}
                    </span>
                  ))
                ) : (
                  <span className="muted small">لا يوجد</span>
                )}
              </span>
            </div>
            <div className="selection-row">
              <span className="muted small">سعر المقاعد</span>
              <span className="small" dir="ltr">
                {number(seats.length)} × {number(trip?.seatPrice ?? 0)}
              </span>
            </div>
          </div>

          <Field label="اسم الزبون" icon="user">
            <input required minLength={2} placeholder="الاسم الكامل" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="رقم الهاتف" icon="phone">
            <input
              required
              dir="ltr"
              inputMode="tel"
              placeholder="09xx xxx xxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>

          <div className="field">
            <span className="field-label">طريقة الدفع</span>
            <Segmented
              value={method}
              onChange={setMethod}
              options={[
                { value: "CASH", label: <><Icon name="cash" size={18} />نقدًا</> },
                { value: "SHAM_CASH", label: <><Icon name="wallet" size={18} />شام كاش</> },
              ]}
            />
          </div>

          {method === "CASH" ? (
            <label className="checkbox boxed">
              <input type="checkbox" checked={received} onChange={(e) => setReceived(e.target.checked)} />
              <span className="box">
                <Icon name="check" size={13} />
              </span>
              تم استلام المبلغ، أكّد الحجز مباشرة
            </label>
          ) : (
            <Field label="رقم عملية شام كاش" icon="wallet">
              <input
                required
                minLength={4}
                dir="ltr"
                placeholder="رقم التحويل"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </Field>
          )}

          <div className="form-bottom">
            <div className="total-row">
              <span className="muted">الإجمالي</span>
              <strong>{money(total)}</strong>
            </div>
            <button className="btn btn-primary btn-lg btn-block" disabled={busy || !trip || !seats.length}>
              <Icon name="check" size={20} />
              {busy ? "جارٍ الحجز…" : "حجز وتأكيد"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
