"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/icon";
import {
  Alert,
  Chips,
  CitySelect,
  ClassBadge,
  DateInput,
  Empty,
  Field,
  Loading,
  Modal,
  Pill,
  RowMenu,
  TRIP_TONE,
  TimeInput,
} from "@/components/ui";
import { api, errorMessage, qs } from "@/lib/api";
import {
  CITIES,
  CLASS_LABEL,
  TRIP_STATUS_LABEL,
  addDays,
  cityName,
  dateRange,
  dayMonth,
  localDateOf,
  localTimeOf,
  money,
  number,
  today,
  tripWhen,
} from "@/lib/format";
import type { Bus, Trip, TripStatus } from "@/lib/types";

type Filter = "ALL" | TripStatus;

export function TripsTab({ createSignal }: { createSignal: number }) {
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(() => addDays(today(), 6));
  const [rangeOpen, setRangeOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [form, setForm] = useState<{ trip: Trip | null } | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const first = useRef(createSignal);

  const load = useCallback(async () => {
    try {
      setTrips(
        await api.get<Trip[]>(`/admin/trips${qs({ from, to, q, status: filter === "ALL" ? "" : filter })}`),
      );
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [from, to, q, filter]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  // "إنشاء رحلة" button in the page header
  useEffect(() => {
    if (createSignal !== first.current) setForm({ trip: null });
  }, [createSignal]);

  async function act(action: () => Promise<unknown>, message: string) {
    setError("");
    setSuccess("");
    try {
      await action();
      setSuccess(message);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <div className="card filter-bar">
        <span className="input-wrap search">
          <Icon name="search" size={18} className="input-icon" />
          <input placeholder="ابحث بالخط أو رقم الباص" value={q} onChange={(e) => setQ(e.target.value)} />
        </span>
        <div className="range">
          <button type="button" className="date-pill-btn" onClick={() => setRangeOpen(!rangeOpen)} aria-expanded={rangeOpen}>
            <Icon name="calendar" size={18} />
            {dateRange(from, to)}
          </button>
          {rangeOpen && (
            <div className="popover">
              <label className="field">
                <span className="field-label">من</span>
                <DateInput value={from} onChange={(v) => { setFrom(v); if (v > to) setTo(v); }} format={dayMonth} />
              </label>
              <label className="field">
                <span className="field-label">إلى</span>
                <DateInput value={to} min={from} onChange={setTo} format={dayMonth} />
              </label>
              <div className="popover-actions">
                <button type="button" className="link-btn" onClick={() => { setFrom(today()); setTo(addDays(today(), 6)); }}>
                  هذا الأسبوع
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setRangeOpen(false)}>تم</button>
              </div>
            </div>
          )}
        </div>
        <Chips
          value={filter}
          onChange={setFilter}
          options={[
            { value: "ALL", label: "الكل" },
            { value: "SCHEDULED", label: "مجدولة" },
            { value: "DEPARTED", label: "انطلقت" },
            { value: "ARRIVED", label: "وصلت" },
            { value: "CANCELLED", label: "ملغى" },
          ]}
        />
      </div>

      {error && <Alert onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert tone="success" onClose={() => setSuccess("")}>{success}</Alert>}

      <section className="card table-card">
        {!trips ? (
          <Loading />
        ) : !trips.length ? (
          <Empty icon="route" title="لا توجد رحلات" text="غيّر الفترة أو الحالة، أو أنشئ رحلة جديدة." />
        ) : (
          <div className="table-scroll">
            <table className="table trips-table">
              <thead>
                <tr>
                  <th>الخط</th>
                  <th>الموعد</th>
                  <th>الباص</th>
                  <th>السعر</th>
                  <th>الإشغال</th>
                  <th>الحالة</th>
                  <th aria-label="إجراءات" />
                </tr>
              </thead>
              <tbody>
                {trips.map((t) => {
                  const rate = t.totalSeats ? Math.round((t.bookedSeats.length / t.totalSeats) * 100) : 0;
                  const future = new Date(t.departureAt) > new Date();
                  return (
                    <tr key={t._id}>
                      <td>
                        <span className="route-cell">
                          <span className="strong">{cityName(t.from)} ← {cityName(t.to)}</span>
                          {t.scheduleId && <span className="badge badge-green">تلقائية</span>}
                        </span>
                      </td>
                      <td className="muted">{tripWhen(t.departureAt)}</td>
                      <td>
                        <span className="bus-cell">
                          <span>{t.bus?.plateNumber ?? "—"}</span>
                          {t.bus && <ClassBadge value={t.bus.busClass} />}
                        </span>
                      </td>
                      <td className="num-green">{money(t.seatPrice)}</td>
                      <td>
                        <span className="occ">
                          <span className="occ-text" dir="ltr">{t.bookedSeats.length} / {t.totalSeats}</span>
                          <span className="bar-track thin">
                            <span className={`bar-fill ${rate < 30 ? "low" : rate < 70 ? "mid" : "high"}`} style={{ width: `${Math.max(rate, 2)}%` }} />
                          </span>
                        </span>
                      </td>
                      <td><Pill tone={TRIP_TONE[t.status]}>{TRIP_STATUS_LABEL[t.status]}</Pill></td>
                      <td className="actions">
                        <RowMenu
                          items={[
                            { label: "تعديل", icon: "edit", hidden: t.status !== "SCHEDULED" || !future, onClick: () => setForm({ trip: t }) },
                            {
                              label: "تسجيل الانطلاق",
                              icon: "play",
                              hidden: t.status !== "SCHEDULED",
                              onClick: () => void act(() => api.patch(`/admin/trips/${t._id}/status`, { status: "DEPARTED" }), "سُجّل انطلاق الرحلة."),
                            },
                            {
                              label: "تسجيل الوصول",
                              icon: "flag",
                              hidden: t.status !== "DEPARTED",
                              onClick: () => void act(() => api.patch(`/admin/trips/${t._id}/status`, { status: "ARRIVED" }), "سُجّل وصول الرحلة واكتملت حجوزاتها."),
                            },
                            {
                              label: "إلغاء الرحلة",
                              icon: "x",
                              danger: true,
                              hidden: t.status !== "SCHEDULED",
                              onClick: () => {
                                if (!window.confirm(`إلغاء رحلة ${cityName(t.from)} ← ${cityName(t.to)}؟ تُلغى حجوزاتها (${t.bookedSeats.length} مقعد) ويُستحق استرداد كامل المبلغ.`)) return;
                                void act(() => api.post(`/admin/trips/${t._id}/cancel`), "أُلغيت الرحلة وحجوزاتها، وأُضيفت إلى قائمة الاسترداد.");
                              },
                            },
                            {
                              label: "حذف",
                              icon: "trash",
                              danger: true,
                              hidden: t.bookedSeats.length > 0 || t.status !== "SCHEDULED",
                              onClick: () => {
                                if (!window.confirm("حذف هذه الرحلة نهائيًا؟")) return;
                                void act(() => api.delete(`/admin/trips/${t._id}`), "حُذفت الرحلة.");
                              },
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {form && (
        <TripForm
          trip={form.trip}
          onClose={() => setForm(null)}
          onSaved={(message) => {
            setForm(null);
            setSuccess(message);
            void load();
          }}
        />
      )}
    </>
  );
}

function TripForm({ trip, onClose, onSaved }: { trip: Trip | null; onClose: () => void; onSaved: (m: string) => void }) {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [from, setFrom] = useState(trip?.from ?? "");
  const [to, setTo] = useState(trip?.to ?? "");
  const [busId, setBusId] = useState(trip?.bus?._id ?? "");
  const [price, setPrice] = useState(trip ? String(trip.seatPrice) : "");
  const [date, setDate] = useState(trip ? localDateOf(trip.departureAt) : addDays(today(), 1));
  const [time, setTime] = useState(trip ? localTimeOf(trip.departureAt) : "08:00");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<Bus[]>("/admin/buses?status=ACTIVE").then(setBuses, (err) => setError(errorMessage(err)));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (from === to) return setError("مدينة الانطلاق والوصول متطابقتان.");
    setBusy(true);
    setError("");
    try {
      if (trip) {
        // Only send what changed: with bookings, the server only accepts price and bus changes
        const body: Record<string, unknown> = {};
        if (from !== trip.from) body.from = from;
        if (to !== trip.to) body.to = to;
        if (busId !== trip.bus?._id) body.busId = busId;
        if (Number(price) !== trip.seatPrice) body.seatPrice = Number(price);
        if (date !== localDateOf(trip.departureAt)) body.date = date;
        if (time !== localTimeOf(trip.departureAt)) body.time = time;
        if (!Object.keys(body).length) return onClose();
        await api.patch(`/admin/trips/${trip._id}`, body);
        onSaved("حُفظت تعديلات الرحلة.");
      } else {
        await api.post("/admin/trips", { from, to, busId, seatPrice: Number(price), date, time });
        onSaved(`أُنشئت رحلة ${cityName(from)} ← ${cityName(to)}.`);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={trip ? "تعديل الرحلة" : "إنشاء رحلة"}
      subtitle={trip && trip.bookedSeats.length ? "الرحلة فيها حجوزات: يمكن تعديل السعر أو تبديل الباص بباص من النوع نفسه فقط" : "رحلة لمرة واحدة خارج الجداول المجدولة"}
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={submit}>
        {error && <Alert>{error}</Alert>}
        <div className="form-grid">
          <label className="field">
            <span className="field-label">من</span>
            <CitySelect required value={from} onChange={setFrom} icon="origin" placeholder="مدينة الانطلاق" options={CITIES} />
          </label>
          <label className="field">
            <span className="field-label">إلى</span>
            <CitySelect required value={to} onChange={setTo} icon="pin" placeholder="مدينة الوصول" options={CITIES} />
          </label>
          <label className="field">
            <span className="field-label">التاريخ</span>
            <DateInput required value={date} min={today()} onChange={setDate} format={dayMonth} />
          </label>
          <label className="field">
            <span className="field-label">وقت الانطلاق</span>
            <TimeInput required value={time} onChange={setTime} />
          </label>
          <label className="field">
            <span className="field-label">الباص</span>
            <span className="input-wrap">
              <Icon name="bus" size={18} className="input-icon" />
              <select required value={busId} onChange={(e) => setBusId(e.target.value)}>
                <option value="">اختر باصًا فعّالًا</option>
                {buses.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.plateNumber} · {CLASS_LABEL[b.busClass]} · {number(b.seatCount)} مقعدًا
                  </option>
                ))}
              </select>
            </span>
          </label>
          <Field label="سعر المقعد (ل.س)" icon="cash">
            <input type="number" required min={0} step={500} dir="ltr" value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>
        </div>
        {price && <p className="muted small">السعر الحالي: {money(Number(price))} للمقعد</p>}
        <div className="modal-actions">
          <button className="btn btn-primary btn-grow" disabled={busy}>
            <Icon name="check" size={18} />
            {trip ? "حفظ التعديلات" : "إنشاء الرحلة"}
          </button>
          <button type="button" className="btn btn-outline" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </Modal>
  );
}
