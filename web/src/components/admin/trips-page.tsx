"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PageHeading } from "@/components/ui/page-heading";
import { EmptyState, ErrorBanner, LoadingState, SuccessBanner } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { useCities } from "@/hooks/use-cities";
import { apiList, apiRequest, entityId, jsonBody } from "@/lib/api";
import { busClassLabels, busSizeLabels, formatDate, formatMoney, getErrorMessage, tripStatusLabels } from "@/lib/format";
import { getSeatCount } from "@/lib/seat-map";
import type { Bus, Trip, TripStatus } from "@/types/domain";

interface TripForm {
  from: string;
  to: string;
  busId: string;
  seatPrice: string;
  departureAt: string;
}

const emptyForm: TripForm = { from: "", to: "", busId: "", seatPrice: "", departureAt: "" };

function toLocalDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function TripsPage() {
  const { cities, error: citiesError, loading: citiesLoading, reload: reloadCities } = useCities();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);
  const [form, setForm] = useState<TripForm>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const [tripRows, busRows] = await Promise.all([
        apiList<Trip>("/admin/trips"),
        apiList<Bus>("/admin/buses"),
      ]);
      setTrips(tripRows);
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
    setForm(emptyForm);
    setActionError("");
    setModalOpen(true);
  }

  function openEdit(trip: Trip) {
    setEditing(trip);
    setForm({
      from: trip.from,
      to: trip.to,
      busId: entityId(trip.busId),
      seatPrice: String(trip.seatPrice),
      departureAt: toLocalDateTime(trip.departureAt),
    });
    setActionError("");
    setModalOpen(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.from === form.to) {
      setActionError("يجب أن تكون مدينة الوصول مختلفة عن مدينة الانطلاق.");
      return;
    }
    setBusy(true);
    setActionError("");
    try {
      const body = {
        from: form.from,
        to: form.to,
        busId: form.busId,
        seatPrice: Number(form.seatPrice),
        departureAt: new Date(form.departureAt).toISOString(),
      };
      await apiRequest<unknown>(
        editing ? `/admin/trips/${encodeURIComponent(editing._id)}` : "/admin/trips",
        { method: editing ? "PATCH" : "POST", body: jsonBody(body) },
      );
      setModalOpen(false);
      setSuccess(editing ? "تم تحديث الرحلة." : "تم إنشاء الرحلة.");
      await load();
    } catch (reason) {
      setActionError(getErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function cancelTrip(trip: Trip) {
    if (!window.confirm(`هل تريد إلغاء رحلة ${trip.from} إلى ${trip.to}؟`)) return;
    setActionError("");
    setSuccess("");
    try {
      await apiRequest<unknown>(`/admin/trips/${encodeURIComponent(trip._id)}/cancel`, {
        method: "POST",
        body: jsonBody({}),
      });
      setSuccess("تم إلغاء الرحلة.");
      await load();
    } catch (reason) {
      setActionError(getErrorMessage(reason));
    }
  }

  async function deleteTrip(trip: Trip) {
    if (!window.confirm("حذف هذه الرحلة نهائياً؟")) return;
    try {
      await apiRequest<void>(`/admin/trips/${encodeURIComponent(trip._id)}`, { method: "DELETE" });
      setSuccess("تم حذف الرحلة.");
      await load();
    } catch (reason) {
      setActionError(getErrorMessage(reason));
    }
  }

  const visibleTrips = trips.filter((trip) => {
    const matchesStatus = filter === "ALL" || trip.status === filter;
    const matchesSearch = `${trip.from} ${trip.to}`.toLowerCase().includes(query.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <>
      <PageHeading title="إدارة الرحلات" description="أنشئ الرحلات اليدوية وحدّث تفاصيلها وتابع حالة المقاعد." action={<button className="button button-primary" onClick={openCreate}><span>＋</span>إنشاء رحلة</button>} />
      {actionError && <ErrorBanner message={actionError} />}
      {success && <SuccessBanner message={success} />}
      <section className="card">
        <div className="toolbar">
          <div className="toolbar-start">
            <input className="filter-control" placeholder="ابحث عن مسار" value={query} onChange={(event) => setQuery(event.target.value)} />
            <select className="filter-control" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="ALL">كل الحالات</option>{Object.entries(tripStatusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
          </div>
          <div className="toolbar-end"><button className="button button-secondary" onClick={() => { setLoading(true); void load(); }}>تحديث</button></div>
        </div>
        {loading ? <LoadingState /> : pageError ? <div className="card-body"><ErrorBanner message={pageError} onRetry={() => void load()} /></div> : !visibleTrips.length ? <EmptyState title="لا توجد رحلات" description="أنشئ رحلة جديدة أو غيّر عوامل التصفية." /> : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>المسار</th><th>الانطلاق</th><th>الباص</th><th>السعر</th><th>الإشغال</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
              <tbody>{visibleTrips.map((trip) => {
                const bus = typeof trip.busId === "object" ? trip.busId : trip.bus ?? buses.find((item) => item._id === trip.busId);
                const booked = trip.bookedSeats?.length ?? 0;
                const capacity = bus ? getSeatCount(bus.busClass, bus.size) : undefined;
                return (
                  <tr key={trip._id}>
                    <td><span className="table-main">{trip.from} ← {trip.to}</span><span className="table-sub">{trip.scheduleId ? "رحلة مجدولة" : "رحلة يدوية"}</span></td>
                    <td>{formatDate(trip.departureAt)}</td>
                    <td>{bus ? <>{bus.plateNumber}<span className="table-sub">{busClassLabels[bus.busClass]} · {busSizeLabels[bus.size]}</span></> : "—"}</td>
                    <td>{formatMoney(trip.seatPrice)}</td>
                    <td>{booked}{capacity ? ` / ${capacity}` : ""}</td>
                    <td><TripStatusPill status={trip.status} /></td>
                    <td><div className="table-actions"><button className="icon-button" aria-label="تعديل الرحلة" onClick={() => openEdit(trip)}>✎</button>{trip.status === "SCHEDULED" && <button className="icon-button" aria-label="إلغاء الرحلة" onClick={() => void cancelTrip(trip)}>⊘</button>}<button className="icon-button" aria-label="حذف الرحلة" onClick={() => void deleteTrip(trip)}>×</button></div></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </section>
      {modalOpen && (
        <Modal title={editing ? "تعديل الرحلة" : "إنشاء رحلة"} description="حدد المسار والباص والسعر وموعد الانطلاق." onClose={() => setModalOpen(false)}>
          {(actionError || citiesError) && <ErrorBanner message={actionError || citiesError} onRetry={citiesError ? reloadCities : undefined} />}
          <form onSubmit={save}>
            <div className="field-grid">
              <label className="field"><span>من</span><select required value={form.from} onChange={(event) => setForm({ ...form, from: event.target.value })} disabled={citiesLoading || !!citiesError}><option value="">اختر مدينة الانطلاق</option>{cities.map((city) => <option key={city.value} value={city.value}>{city.name}</option>)}</select></label>
              <label className="field"><span>إلى</span><select required value={form.to} onChange={(event) => setForm({ ...form, to: event.target.value })} disabled={citiesLoading || !!citiesError}><option value="">اختر مدينة الوصول</option>{cities.map((city) => <option key={city.value} value={city.value}>{city.name}</option>)}</select></label>
              <label className="field"><span>الباص</span><select required value={form.busId} onChange={(event) => setForm({ ...form, busId: event.target.value })}><option value="">اختر الباص</option>{buses.filter((bus) => bus.status === "ACTIVE").map((bus) => <option key={bus._id} value={bus._id}>{bus.plateNumber} · {busClassLabels[bus.busClass]} · {busSizeLabels[bus.size]}</option>)}</select></label>
              <label className="field"><span>سعر المقعد (ل.س)</span><input type="number" min="0" required value={form.seatPrice} onChange={(event) => setForm({ ...form, seatPrice: event.target.value })} /></label>
              <label className="field"><span>موعد الانطلاق</span><input type="datetime-local" required value={form.departureAt} onChange={(event) => setForm({ ...form, departureAt: event.target.value })} /></label>
            </div>
            <div className="form-actions"><button className="button button-primary" disabled={busy || !buses.length || citiesLoading}>{busy ? "جارٍ الحفظ…" : "حفظ الرحلة"}</button><button type="button" className="button button-secondary" onClick={() => setModalOpen(false)}>إلغاء</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}

function TripStatusPill({ status }: { status: TripStatus }) {
  const style = status === "CANCELLED" ? "danger" : status === "DEPARTED" ? "warning" : status === "ARRIVED" ? "neutral" : "";
  return <span className={`status-pill ${style}`}>{tripStatusLabels[status]}</span>;
}
