"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/icon";
import { Alert, CitySelect, DateInput, Empty, Field, Loading, Segmented, TimeInput, Toggle } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import {
  CITIES,
  CLASS_LABEL,
  WEEKDAYS,
  WEEKDAY_SHORT,
  addDays,
  cityName,
  frequencyText,
  money,
  number,
  shortDate,
  timeFromHHmm,
  today,
} from "@/lib/format";
import type { Bus, Frequency, Schedule } from "@/lib/types";

interface Form {
  from: string;
  to: string;
  busId: string;
  seatPrice: string;
  departureTime: string;
  frequency: Frequency;
  weekDays: number[];
  monthDay: number;
  startDate: string;
  endDate: string;
  active: boolean;
}

const emptyForm = (): Form => ({
  from: "",
  to: "",
  busId: "",
  seatPrice: "",
  departureTime: "06:00",
  frequency: "DAILY",
  weekDays: [],
  monthDay: 1,
  startDate: today(),
  endDate: addDays(today(), 60),
  active: true,
});

const toForm = (s: Schedule): Form => ({
  from: s.from,
  to: s.to,
  busId: s.busId,
  seatPrice: String(s.seatPrice),
  departureTime: s.departureTime,
  frequency: s.frequency,
  weekDays: s.frequency === "WEEKLY" ? s.days : [],
  monthDay: s.frequency === "MONTHLY" ? s.days[0] : 1,
  startDate: s.startDate,
  endDate: s.endDate,
  active: s.active,
});

const toBody = (f: Form) => ({
  from: f.from,
  to: f.to,
  busId: f.busId,
  seatPrice: Number(f.seatPrice),
  departureTime: f.departureTime,
  frequency: f.frequency,
  days: f.frequency === "WEEKLY" ? f.weekDays : f.frequency === "MONTHLY" ? [f.monthDay] : [],
  startDate: f.startDate,
  endDate: f.endDate,
  active: f.active,
});

export function SchedulesTab({ createSignal }: { createSignal: number }) {
  const [schedules, setSchedules] = useState<Schedule[] | null>(null);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const first = useRef(createSignal);
  const formRef = useRef<HTMLFormElement>(null);

  const load = useCallback(async () => {
    try {
      const [s, b] = await Promise.all([api.get<Schedule[]>("/admin/schedules"), api.get<Bus[]>("/admin/buses")]);
      setSchedules(s);
      setBuses(b);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  // "إنشاء جدول" button in the page header: empty form, focused
  useEffect(() => {
    if (createSignal === first.current) return;
    setEditing(null);
    setForm(emptyForm());
    formRef.current?.querySelector("select")?.focus();
  }, [createSignal]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  function edit(s: Schedule) {
    setEditing(s);
    setForm(toForm(s));
    setError("");
  }

  function reset() {
    setEditing(null);
    setForm(emptyForm());
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (form.from === form.to) return setError("مدينة الانطلاق والوصول متطابقتان.");
    if (form.frequency === "WEEKLY" && !form.weekDays.length) return setError("اختر يومًا واحدًا على الأقل من أيام الأسبوع.");
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const saved = editing
        ? await api.patch<Schedule>(`/admin/schedules/${editing._id}`, toBody(form))
        : await api.post<Schedule>("/admin/schedules", toBody(form));
      setSuccess(
        `${editing ? "حُفظ" : "أُنشئ"} جدول ${cityName(saved.from)} ← ${cityName(saved.to)}، وفيه ${number(saved.upcomingTrips)} رحلة قادمة جاهزة للحجز.`,
      );
      reset();
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(s: Schedule, active: boolean) {
    setSchedules((list) => list?.map((x) => (x._id === s._id ? { ...x, active } : x)) ?? null);
    try {
      await api.patch(`/admin/schedules/${s._id}`, toBody({ ...toForm(s), active }));
      await load();
    } catch (err) {
      setError(errorMessage(err));
      await load();
    }
  }

  async function remove() {
    if (!editing || !window.confirm("حذف هذا الجدول؟ تُحذف رحلاته القادمة غير المحجوزة، وتبقى الرحلات التي فيها حجوزات.")) return;
    setBusy(true);
    try {
      await api.delete(`/admin/schedules/${editing._id}`);
      setSuccess("حُذف الجدول.");
      reset();
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const activeBuses = buses.filter((b) => b.status === "ACTIVE" || b._id === form.busId);

  return (
    <>
      {success && <Alert tone="success" onClose={() => setSuccess("")}>{success}</Alert>}
      <div className="split schedules">
        <section className="card table-card">
          {!schedules ? (
            <Loading />
          ) : !schedules.length ? (
            <Empty icon="repeat" title="لا توجد جداول" text="أنشئ جدولًا لتتولّد رحلاته تلقائيًا لثلاثين يومًا قادمة." />
          ) : (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>الخط والوقت</th>
                    <th>الباص</th>
                    <th>التكرار</th>
                    <th>الفترة</th>
                    <th>فعّال</th>
                    <th aria-label="تعديل" />
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => (
                    <tr key={s._id} className={editing?._id === s._id ? "selected" : ""} onClick={() => edit(s)}>
                      <td>
                        <span className="strong">{cityName(s.from)} ← {cityName(s.to)}</span>
                        <span className="sub time-sub">
                          <Icon name="clock" size={13} />
                          {timeFromHHmm(s.departureTime)}
                        </span>
                      </td>
                      <td>{s.bus?.plateNumber ?? "—"}</td>
                      <td>
                        <span className="repeat-cell">
                          <Icon name="repeat" size={15} />
                          {frequencyText(s.frequency, s.days)}
                        </span>
                      </td>
                      <td className="muted small nowrap" dir="ltr">{shortDate(s.startDate)} – {shortDate(s.endDate)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <Toggle checked={s.active} label="تفعيل الجدول" onChange={(v) => void toggleActive(s, v)} />
                      </td>
                      <td className="actions">
                        <button type="button" className="icon-btn ghost green" aria-label="تعديل الجدول" onClick={(e) => { e.stopPropagation(); edit(s); }}>
                          <Icon name="edit" size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <form className="card panel side-form" onSubmit={save} ref={formRef}>
          <div className="panel-head">
            <div>
              <h2>{editing ? "تعديل جدول رحلات" : "إنشاء جدول رحلات"}</h2>
              <p className="muted small">قالب الرحلة + قاعدة التكرار، وتُولَّد الرحلات تلقائيًا</p>
            </div>
            {editing && (
              <button type="button" className="icon-btn soft" onClick={reset} aria-label="إغلاق التعديل">
                <Icon name="x" size={16} />
              </button>
            )}
          </div>

          {error && <Alert onClose={() => setError("")}>{error}</Alert>}

          <div className="form-grid">
            <label className="field">
              <span className="field-label">من</span>
              <CitySelect required value={form.from} onChange={(v) => set("from", v)} icon="origin" placeholder="الانطلاق" options={CITIES} />
            </label>
            <label className="field">
              <span className="field-label">إلى</span>
              <CitySelect required value={form.to} onChange={(v) => set("to", v)} icon="pin" placeholder="الوصول" options={CITIES} />
            </label>
            <label className="field">
              <span className="field-label">الباص</span>
              <span className="input-wrap">
                <Icon name="bus" size={18} className="input-icon" />
                <select required value={form.busId} onChange={(e) => set("busId", e.target.value)}>
                  <option value="">اختر الباص</option>
                  {activeBuses.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.plateNumber} · {CLASS_LABEL[b.busClass]}
                    </option>
                  ))}
                </select>
              </span>
            </label>
            <label className="field">
              <span className="field-label">وقت الانطلاق</span>
              <TimeInput required value={form.departureTime} onChange={(v) => set("departureTime", v)} />
            </label>
          </div>

          <Field label="سعر المقعد (ل.س)" icon="cash">
            <input type="number" required min={0} step={500} dir="ltr" placeholder="85000" value={form.seatPrice} onChange={(e) => set("seatPrice", e.target.value)} />
          </Field>

          <div className="field">
            <span className="field-label">التكرار</span>
            <Segmented
              value={form.frequency}
              onChange={(v) => set("frequency", v)}
              options={[
                { value: "DAILY", label: "يومي" },
                { value: "WEEKLY", label: "أسبوعي" },
                { value: "MONTHLY", label: "شهري" },
              ]}
            />
          </div>

          {form.frequency === "WEEKLY" && (
            <div className="field">
              <span className="field-label">أيام الأسبوع</span>
              <div className="weekdays">
                {WEEKDAY_SHORT.map((label, d) => (
                  <button
                    key={d}
                    type="button"
                    title={WEEKDAYS[d]}
                    aria-label={WEEKDAYS[d]}
                    aria-pressed={form.weekDays.includes(d)}
                    className={form.weekDays.includes(d) ? "active" : ""}
                    onClick={() =>
                      set("weekDays", form.weekDays.includes(d) ? form.weekDays.filter((x) => x !== d) : [...form.weekDays, d].sort())
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.frequency === "MONTHLY" && (
            <label className="field">
              <span className="field-label">يوم من الشهر</span>
              <span className="input-wrap">
                <Icon name="calendar" size={18} className="input-icon" />
                <select value={form.monthDay} onChange={(e) => set("monthDay", Number(e.target.value))}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      يوم {d} من كل شهر
                    </option>
                  ))}
                </select>
              </span>
              {form.monthDay > 28 && <small className="field-hint">في الأشهر الأقصر تكون الرحلة في آخر يوم من الشهر.</small>}
            </label>
          )}

          <div className="form-grid">
            <label className="field">
              <span className="field-label">تاريخ البداية</span>
              <DateInput required value={form.startDate} onChange={(v) => set("startDate", v)} format={slashDate} />
            </label>
            <label className="field">
              <span className="field-label">تاريخ النهاية</span>
              <DateInput required value={form.endDate} min={form.startDate} onChange={(v) => set("endDate", v)} format={slashDate} />
            </label>
          </div>

          <p className="note">
            <Icon name="info" size={18} />
            تُبقي المهمة اليومية رحلات 30 يومًا قادمة جاهزة، ولا تتأثر الرحلات التي فيها حجوزات عند تعديل الجدول.
          </p>

          {form.seatPrice && <p className="muted small">سعر المقعد: {money(Number(form.seatPrice))}</p>}

          <div className="form-actions">
            <button className="btn btn-primary btn-grow" disabled={busy}>
              <Icon name="check" size={18} />
              حفظ الجدول
            </button>
            <button type="button" className="btn btn-outline" onClick={reset}>إلغاء</button>
            {editing && (
              <button type="button" className="icon-btn danger" onClick={() => void remove()} aria-label="حذف الجدول" title="حذف الجدول">
                <Icon name="trash" size={18} />
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}

/** "01/11/2026" */
const slashDate = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
