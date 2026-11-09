"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PageHeading } from "@/components/ui/page-heading";
import { EmptyState, ErrorBanner, LoadingState, SuccessBanner } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { useCities } from "@/hooks/use-cities";
import { apiList, apiRequest, entityId, jsonBody } from "@/lib/api";
import { busClassLabels, busSizeLabels, formatMoney, getErrorMessage } from "@/lib/format";
import type { Bus, ScheduleFrequency, TripSchedule } from "@/types/domain";

interface ScheduleForm {
  from: string;
  to: string;
  busId: string;
  seatPrice: string;
  departureTime: string;
  frequency: ScheduleFrequency;
  days: number[];
  startDate: string;
  endDate: string;
  active: boolean;
}

const weekdayLabels = [
  { value: 0, label: "الأحد" },
  { value: 1, label: "الاثنين" },
  { value: 2, label: "الثلاثاء" },
  { value: 3, label: "الأربعاء" },
  { value: 4, label: "الخميس" },
  { value: 5, label: "الجمعة" },
  { value: 6, label: "السبت" },
];

function todayValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function emptySchedule(): ScheduleForm {
  return {
    from: "",
    to: "",
    busId: "",
    seatPrice: "",
    departureTime: "08:00",
    frequency: "DAILY",
    days: [],
    startDate: todayValue(),
    endDate: "",
    active: true,
  };
}

export function SchedulesPage() {
  const { cities, error: citiesError, loading: citiesLoading, reload: reloadCities } = useCities();
  const [schedules, setSchedules] = useState<TripSchedule[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TripSchedule | null>(null);
  const [form, setForm] = useState<ScheduleForm>(emptySchedule);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [rows, busRows] = await Promise.all([
        apiList<TripSchedule>("/admin/schedules"),
        apiList<Bus>("/admin/buses"),
      ]);
      setSchedules(rows);
      setBuses(busRows);
      setPageError("");
    } catch (reason) {
      setPageError(getErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const request = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(request);
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptySchedule());
    setActionError("");
    setModalOpen(true);
  }

  function openEdit(schedule: TripSchedule) {
    setEditing(schedule);
    setForm({
      from: schedule.from,
      to: schedule.to,
      busId: entityId(schedule.busId),
      seatPrice: String(schedule.seatPrice),
      departureTime: schedule.departureTime,
      frequency: schedule.frequency,
      days: schedule.days ?? [],
      startDate: schedule.startDate.slice(0, 10),
      endDate: schedule.endDate?.slice(0, 10) ?? "",
      active: schedule.active,
    });
    setActionError("");
    setModalOpen(true);
  }

  function toggleDay(day: number) {
    setForm((current) => ({
      ...current,
      days: current.days.includes(day)
        ? current.days.filter((item) => item !== day)
        : [...current.days, day].sort((a, b) => a - b),
    }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.from === form.to) {
      setActionError("يجب اختيار مسار بين مدينتين مختلفتين.");
      return;
    }
    if (form.frequency === "WEEKLY" && form.days.length === 0) {
      setActionError("اختر يوماً واحداً على الأقل للتكرار الأسبوعي.");
      return;
    }
    setBusy(true);
    setActionError("");
    try {
      const body = {
        ...form,
        seatPrice: Number(form.seatPrice),
        endDate: form.endDate || null,
        days: form.frequency === "WEEKLY" ? form.days : [],
      };
      await apiRequest<unknown>(
        editing ? `/admin/schedules/${encodeURIComponent(editing._id)}` : "/admin/schedules",
        { method: editing ? "PATCH" : "POST", body: jsonBody(body) },
      );
      setModalOpen(false);
      setSuccess(editing ? "تم تحديث الجدول." : "تم إنشاء الجدول.");
      await load();
    } catch (reason) {
      setActionError(getErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function remove(schedule: TripSchedule) {
    if (!window.confirm(`حذف الجدول ${schedule.from} إلى ${schedule.to}؟`)) return;
    setActionError("");
    try {
      await apiRequest<void>(`/admin/schedules/${encodeURIComponent(schedule._id)}`, { method: "DELETE" });
      setSuccess("تم حذف الجدول. الرحلات التي تم توليدها سابقاً لا تتأثر.");
      await load();
    } catch (reason) {
      setActionError(getErrorMessage(reason));
    }
  }

  return (
    <>
      <PageHeading title="الجداول المجدولة" description="أنشئ رحلات متكررة يومياً أو أسبوعياً أو شهرياً؛ تُولّد الرحلات القادمة تلقائياً." action={<button className="button button-primary" onClick={openCreate}><span>＋</span>إضافة جدول</button>} />
      {actionError && <ErrorBanner message={actionError} />}
      {success && <SuccessBanner message={success} />}
      <section className="card">
        <div className="toolbar"><div className="toolbar-start"><strong>{schedules.length.toLocaleString("ar-SY")} جدول</strong></div><div className="toolbar-end"><button className="button button-secondary" onClick={() => { setLoading(true); void load(); }}>تحديث</button></div></div>
        {loading ? <LoadingState /> : pageError ? <div className="card-body"><ErrorBanner message={pageError} onRetry={() => void load()} /></div> : !schedules.length ? <EmptyState title="لا توجد جداول" description="أضف جدولاً متكرراً لتوليد الرحلات تلقائياً خلال الثلاثين يوماً القادمة." /> : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>المسار</th><th>الباص</th><th>وقت الانطلاق</th><th>التكرار</th><th>سعر المقعد</th><th>الفترة</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
              <tbody>{schedules.map((schedule) => {
                const bus = typeof schedule.busId === "object" ? schedule.busId : buses.find((item) => item._id === schedule.busId);
                return (
                  <tr key={schedule._id}>
                    <td><span className="table-main">{schedule.from} ← {schedule.to}</span></td>
                    <td>{bus ? <>{bus.plateNumber}<span className="table-sub">{busClassLabels[bus.busClass]} · {busSizeLabels[bus.size]}</span></> : "—"}</td>
                    <td>{schedule.departureTime}</td>
                    <td><FrequencyLabel schedule={schedule} /></td>
                    <td>{formatMoney(schedule.seatPrice)}</td>
                    <td>{schedule.startDate.slice(0, 10)}{schedule.endDate ? ` — ${schedule.endDate.slice(0, 10)}` : " — مستمر"}</td>
                    <td><span className={`status-pill ${schedule.active ? "" : "neutral"}`}>{schedule.active ? "نشط" : "متوقف"}</span></td>
                    <td><div className="table-actions"><button className="icon-button" aria-label="تعديل الجدول" onClick={() => openEdit(schedule)}>✎</button><button className="icon-button" aria-label="حذف الجدول" onClick={() => void remove(schedule)}>×</button></div></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </section>
      {modalOpen && (
        <Modal title={editing ? "تعديل الجدول" : "إضافة جدول متكرر"} description="تفاصيل الرحلة المتكررة التي ستُنشأ ضمن نافذة الثلاثين يوماً." onClose={() => setModalOpen(false)} size="wide">
          {(actionError || citiesError) && <ErrorBanner message={actionError || citiesError} onRetry={citiesError ? reloadCities : undefined} />}
          <form onSubmit={save}>
            <div className="field-grid">
              <label className="field"><span>من</span><select required value={form.from} onChange={(event) => setForm({ ...form, from: event.target.value })} disabled={citiesLoading || !!citiesError}><option value="">مدينة الانطلاق</option>{cities.map((city) => <option key={city.value} value={city.value}>{city.name}</option>)}</select></label>
              <label className="field"><span>إلى</span><select required value={form.to} onChange={(event) => setForm({ ...form, to: event.target.value })} disabled={citiesLoading || !!citiesError}><option value="">مدينة الوصول</option>{cities.map((city) => <option key={city.value} value={city.value}>{city.name}</option>)}</select></label>
              <label className="field"><span>الباص</span><select required value={form.busId} onChange={(event) => setForm({ ...form, busId: event.target.value })}><option value="">اختر الباص</option>{buses.filter((bus) => bus.status === "ACTIVE").map((bus) => <option key={bus._id} value={bus._id}>{bus.plateNumber} · {busClassLabels[bus.busClass]}</option>)}</select></label>
              <label className="field"><span>سعر المقعد (ل.س)</span><input type="number" min="0" required value={form.seatPrice} onChange={(event) => setForm({ ...form, seatPrice: event.target.value })} /></label>
              <label className="field"><span>وقت الانطلاق</span><input type="time" required value={form.departureTime} onChange={(event) => setForm({ ...form, departureTime: event.target.value })} /></label>
              <label className="field"><span>التكرار</span><select value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value as ScheduleFrequency })}><option value="DAILY">يومي</option><option value="WEEKLY">أسبوعي</option><option value="MONTHLY">شهري</option></select></label>
              <label className="field"><span>تاريخ البدء</span><input type="date" required value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></label>
              <label className="field"><span>تاريخ الانتهاء (اختياري)</span><input type="date" min={form.startDate} value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></label>
            </div>
            {form.frequency === "WEEKLY" && (
              <fieldset className="weekday-picker">
                <legend>أيام التكرار</legend>
                <div>{weekdayLabels.map((day) => <label key={day.value} className={`weekday-option${form.days.includes(day.value) ? " selected" : ""}`}><input type="checkbox" checked={form.days.includes(day.value)} onChange={() => toggleDay(day.value)} />{day.label}</label>)}</div>
              </fieldset>
            )}
            {form.frequency === "MONTHLY" && <p className="muted-note">يُكرّر النظام الرحلة في يوم الشهر الموافق لتاريخ البدء.</p>}
            <label className="check-field"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /><span>الجدول نشط ويولّد رحلات جديدة</span></label>
            <div className="form-actions"><button className="button button-primary" disabled={busy || !buses.length || citiesLoading}>{busy ? "جارٍ الحفظ…" : "حفظ الجدول"}</button><button type="button" className="button button-secondary" onClick={() => setModalOpen(false)}>إلغاء</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}

function FrequencyLabel({ schedule }: { schedule: TripSchedule }) {
  const frequency = schedule.frequency === "DAILY" ? "يومي" : schedule.frequency === "MONTHLY" ? "شهري" : "أسبوعي";
  const days = schedule.days?.map((value) => weekdayLabels.find((day) => day.value === value)?.label).filter(Boolean).join("، ");
  return <>{frequency}{days ? <span className="table-sub">{days}</span> : null}</>;
}
