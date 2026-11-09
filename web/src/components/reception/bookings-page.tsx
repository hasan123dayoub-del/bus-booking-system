"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SeatMap } from "@/components/seat-map/seat-map";
import { PageHeading } from "@/components/ui/page-heading";
import { EmptyState, ErrorBanner, LoadingState, SuccessBanner } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { apiList, apiRequest } from "@/lib/api";
import { formatDate, formatMoney, getErrorMessage, paymentMethodLabels } from "@/lib/format";
import type { Booking, Bus, Manifest, Trip } from "@/types/domain";

function todayValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isManifest(value: unknown): value is Manifest {
  return (
    typeof value === "object" &&
    value !== null &&
    "trip" in value &&
    "bookings" in value &&
    Array.isArray(value.bookings)
  );
}

export function ReceptionBookingsPage() {
  const [date, setDate] = useState(todayValue);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripId, setTripId] = useState("");
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingManifest, setLoadingManifest] = useState(false);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState("");
  const [changing, setChanging] = useState<{ booking: Booking; seatNumber: number } | null>(null);
  const [newSeatNumber, setNewSeatNumber] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const loadTrips = useCallback(async () => {
    try {
      const rows = await apiList<Trip>(`/staff/trips?date=${encodeURIComponent(date)}`);
      setTrips(rows);
      setPageError("");
      setManifest(null);
      setTripId("");
    } catch (reason) {
      setPageError(getErrorMessage(reason));
      setTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  }, [date]);

  useEffect(() => {
    const request = window.setTimeout(() => { void loadTrips(); }, 0);
    return () => window.clearTimeout(request);
  }, [loadTrips]);

  const bus: Bus | null = useMemo(() => {
    if (!manifest) return null;
    if (manifest.trip.bus) return manifest.trip.bus;
    if (typeof manifest.trip.busId === "object") return manifest.trip.busId;
    const trip = trips.find((item) => item._id === manifest.trip._id);
    if (trip && typeof trip.busId === "object") return trip.busId;
    return trip?.bus ?? null;
  }, [manifest, trips]);

  async function selectTrip(value: string, preserveFeedback = false) {
    setTripId(value);
    setManifest(null);
    setPageError("");
    if (!preserveFeedback) {
      setActionError("");
      setSuccess("");
    }
    if (!value) return;
    setLoadingManifest(true);
    try {
      const response = await apiRequest<unknown>(`/staff/trips/${encodeURIComponent(value)}/manifest`);
      if (!isManifest(response)) throw new Error("استجابة قائمة الركاب غير صالحة");
      const listed = trips.find((trip) => trip._id === value);
      setManifest({
        ...response,
        trip: {
          ...response.trip,
          bus: response.trip.bus ?? (typeof response.trip.busId === "object" ? response.trip.busId : listed?.bus),
        },
      });
    } catch (reason) {
      setPageError(getErrorMessage(reason));
    } finally {
      setLoadingManifest(false);
    }
  }

  async function cancel(booking: Booking) {
    if (!window.confirm(`إلغاء الحجز ${booking.code}؟`)) return;
    setActionError("");
    setSuccess("");
    try {
      await apiRequest<unknown>(`/staff/bookings/${encodeURIComponent(booking._id)}/cancel`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setSuccess(`تم إلغاء الحجز ${booking.code}.`);
      if (tripId) await selectTrip(tripId, true);
    } catch (reason) {
      setActionError(getErrorMessage(reason));
    }
  }

  function openChange(booking: Booking, seatNumber: number) {
    setActionError("");
    setNewSeatNumber(null);
    setChanging({ booking, seatNumber });
  }

  async function saveSeatChange() {
    if (!changing || newSeatNumber === null || newSeatNumber === changing.seatNumber) return;
    setBusy(true);
    setActionError("");
    setSuccess("");
    try {
      await apiRequest<unknown>(`/staff/bookings/${encodeURIComponent(changing.booking._id)}/change-seat`, {
        method: "PATCH",
        body: JSON.stringify({
          seatNumber: changing.seatNumber,
          newSeatNumber,
        }),
      });
      setSuccess(`تم تغيير المقعد إلى ${newSeatNumber}.`);
      setChanging(null);
      if (tripId) await selectTrip(tripId, true);
    } catch (reason) {
      setActionError(getErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  const bookedSeats = manifest?.trip.bookedSeats ?? [];

  return (
    <>
      <PageHeading eyebrow="منصة الاستقبال" title="الرحلات والركاب" description="اختر رحلة لعرض قائمة الركاب وتعديل المقاعد أو إلغاء الحجوزات." />
      {pageError && <ErrorBanner message={pageError} onRetry={() => tripId ? void selectTrip(tripId) : void loadTrips()} />}
      {actionError && <ErrorBanner message={actionError} />}
      {success && <SuccessBanner message={success} />}
      <section className="card">
        <div className="card-header"><div><h2>اختيار الرحلة</h2><p>قائمة الرحلات حسب التاريخ المحدد.</p></div><div className="toolbar-end"><label className="field"><span>التاريخ</span><input type="date" value={date} onChange={(event) => { setLoadingTrips(true); setManifest(null); setTripId(""); setDate(event.target.value); }} /></label><button className="button button-secondary" onClick={() => { setLoadingTrips(true); void loadTrips(); }}>تحديث</button></div></div>
        <div className="card-body">
          {loadingTrips ? <LoadingState /> : !trips.length ? <EmptyState title="لا توجد رحلات في هذا التاريخ" description="اختر يوماً آخر لعرض الرحلات وقوائم الركاب." /> : (
            <label className="field"><span>الرحلة</span><select value={tripId} onChange={(event) => void selectTrip(event.target.value)}><option value="">اختر رحلة لعرض قائمة الركاب</option>{trips.map((trip) => <option key={trip._id} value={trip._id}>{trip.from} ← {trip.to} · {formatDate(trip.departureAt)}</option>)}</select></label>
          )}
        </div>
      </section>
      {tripId && (
        <section className="card manifest-card">
          <div className="card-header"><div><h2>قائمة الركاب</h2><p>{manifest ? `${manifest.trip.from} ← ${manifest.trip.to} · ${formatDate(manifest.trip.departureAt)}` : "تفاصيل الركاب للحجز"}</p></div>{manifest && <span className="status-pill">{manifest.bookings.length.toLocaleString("ar-SY")} حجز</span>}</div>
          {loadingManifest ? <LoadingState label="جارٍ تحميل قائمة الركاب…" /> : manifest && manifest.bookings.length ? (
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr><th>رمز الحجز</th><th>الراكبون والمقاعد</th><th>طريقة الدفع</th><th>الإجمالي</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
                <tbody>{manifest.bookings.map((booking) => (
                  <tr key={booking._id}>
                    <td><span className="table-main">{booking.code}</span></td>
                    <td>{booking.seats.map((seat) => <div key={seat.seatNumber} className="passenger-booking-row"><span>{seat.passengerName}</span><span className="status-pill neutral">مقعد {seat.seatNumber}</span>{booking.status === "CONFIRMED" && <button className="text-button" onClick={() => openChange(booking, seat.seatNumber)}>تغيير</button>}</div>)}</td>
                    <td>{paymentMethodLabels[booking.paymentMethod]}{booking.paymentRef && <span className="table-sub">رقم العملية: {booking.paymentRef}</span>}</td>
                    <td>{formatMoney(booking.total)}</td>
                    <td><BookingStatus status={booking.status} /></td>
                    <td>{booking.status === "CONFIRMED" ? <button className="button button-danger" onClick={() => void cancel(booking)}>إلغاء الحجز</button> : "—"}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : !loadingManifest && manifest ? <EmptyState title="لا توجد حجوزات على هذه الرحلة" description="ستظهر الحجوزات المؤكدة هنا." /> : null}
        </section>
      )}
      {changing && bus && (
        <Modal title={`تغيير مقعد الحجز ${changing.booking.code}`} description={`اختر مقعداً بديلاً للمقعد ${changing.seatNumber}.`} onClose={() => setChanging(null)} size="wide">
          {actionError && <ErrorBanner message={actionError} />}
          <SeatMap
            busClass={bus.busClass}
            size={bus.size}
            bookedSeats={bookedSeats.filter((seat) => seat !== changing.seatNumber)}
            selectedSeats={newSeatNumber === null ? [] : [newSeatNumber]}
            onToggle={(seat) => setNewSeatNumber(seat === newSeatNumber ? null : seat)}
          />
          <div className="form-actions"><button className="button button-primary" disabled={busy || newSeatNumber === null} onClick={() => void saveSeatChange()}>{busy ? "جارٍ التحديث…" : "تأكيد تغيير المقعد"}</button><button className="button button-secondary" onClick={() => setChanging(null)}>إلغاء</button></div>
        </Modal>
      )}
      {changing && !bus && <Modal title="تغيير المقعد" onClose={() => setChanging(null)}><ErrorBanner message="بيانات الباص غير متاحة لهذه الرحلة، تعذر عرض المقاعد." /></Modal>}
    </>
  );
}

function BookingStatus({ status }: { status: Booking["status"] }) {
  const label = status === "CONFIRMED" ? "مؤكد" : status === "CANCELLED" ? "ملغى" : "مكتمل";
  const style = status === "CANCELLED" ? "danger" : status === "COMPLETED" ? "neutral" : "";
  return <span className={`status-pill ${style}`}>{label}</span>;
}
