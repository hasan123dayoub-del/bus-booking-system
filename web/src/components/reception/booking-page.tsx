"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { SeatMap } from "@/components/seat-map/seat-map";
import { PageHeading } from "@/components/ui/page-heading";
import { EmptyState, ErrorBanner, LoadingState, SuccessBanner } from "@/components/ui/feedback";
import { apiList, apiRequest, jsonBody } from "@/lib/api";
import { formatDate, formatMoney, getErrorMessage } from "@/lib/format";
import { getSeatCount } from "@/lib/seat-map";
import type { Bus, Manifest, PaymentMethod, Trip } from "@/types/domain";

function todayValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function normalizeManifest(value: Manifest): Manifest {
  if (!value || !value.trip || !Array.isArray(value.bookings)) {
    throw new Error("استجابة قائمة الركاب لا تحتوي على الرحلة والحجوزات");
  }
  return value;
}

function responseBookingCode(value: unknown) {
  if (typeof value !== "object" || value === null) return "";
  const candidate = value as { code?: unknown; booking?: { code?: unknown } };
  if (typeof candidate.code === "string") return candidate.code;
  return typeof candidate.booking?.code === "string" ? candidate.booking.code : "";
}

export function ReceptionBookingPage() {
  const [date, setDate] = useState(todayValue);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [passengerNames, setPassengerNames] = useState<Record<number, string>>({});
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [paymentRef, setPaymentRef] = useState("");
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingManifest, setLoadingManifest] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadTrips = useCallback(async () => {
    try {
      const rows = await apiList<Trip>(`/staff/trips?date=${encodeURIComponent(date)}`);
      setTrips(rows);
      setError("");
      setManifest(null);
      setSelectedTripId("");
      setSelectedSeats([]);
    } catch (reason) {
      setError(getErrorMessage(reason));
      setTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  }, [date]);

  useEffect(() => {
    const request = window.setTimeout(() => { void loadTrips(); }, 0);
    return () => window.clearTimeout(request);
  }, [loadTrips]);

  const selectedTrip = useMemo(
    () => manifest?.trip ?? trips.find((trip) => trip._id === selectedTripId) ?? null,
    [manifest, selectedTripId, trips],
  );
  const selectedBus: Bus | null = useMemo(() => {
    if (!selectedTrip) return null;
    if (typeof selectedTrip.busId === "object") return selectedTrip.busId;
    if (selectedTrip.bus) return selectedTrip.bus;
    const listedTrip = trips.find((trip) => trip._id === selectedTrip._id);
    if (listedTrip && typeof listedTrip.busId === "object") return listedTrip.busId;
    return listedTrip?.bus ?? null;
  }, [selectedTrip, trips]);
  const total = (selectedTrip?.seatPrice ?? 0) * selectedSeats.length;

  async function selectTrip(tripId: string, preserveFeedback = false) {
    setSelectedTripId(tripId);
    setManifest(null);
    setSelectedSeats([]);
    setPassengerNames({});
    if (!preserveFeedback) {
      setError("");
      setSuccess("");
    }
    if (!tripId) return;
    setLoadingManifest(true);
    try {
      const response = await apiRequest<Manifest>(
        `/staff/trips/${encodeURIComponent(tripId)}/manifest`,
      );
      const data = normalizeManifest(response);
      const listed = trips.find((trip) => trip._id === tripId);
      const trip: Trip = {
        ...data.trip,
        bus:
          data.trip.bus ??
          (typeof data.trip.busId === "object" ? data.trip.busId : listed?.bus),
      };
      setManifest({ ...data, trip });
      if (!trip.bus) {
        setError("لم تتضمن بيانات الرحلة نوع الباص، لذلك تعذر عرض مخطط المقاعد.");
      }
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setLoadingManifest(false);
    }
  }

  function toggleSeat(seatNumber: number) {
    setSelectedSeats((current) => {
      if (current.includes(seatNumber)) {
        setPassengerNames((names) => {
          const next = { ...names };
          delete next[seatNumber];
          return next;
        });
        return current.filter((seat) => seat !== seatNumber);
      }
      return [...current, seatNumber].sort((a, b) => a - b);
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTrip || selectedSeats.length === 0) {
      setError("اختر رحلة ومقعداً واحداً على الأقل.");
      return;
    }
    if (selectedSeats.some((seat) => !passengerNames[seat]?.trim())) {
      setError("أدخل اسم كل راكب قبل تثبيت الحجز.");
      return;
    }
    if (paymentMethod === "SHAM_CASH" && !paymentRef.trim()) {
      setError("أدخل رقم عملية شام كاش للتحقق من الدفع.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await apiRequest<unknown>("/staff/bookings", {
        method: "POST",
        body: jsonBody({
          tripId: selectedTrip._id,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          seats: selectedSeats.map((seatNumber) => ({
            seatNumber,
            passengerName: passengerNames[seatNumber].trim(),
          })),
          paymentMethod,
          ...(paymentMethod === "SHAM_CASH" ? { paymentRef: paymentRef.trim() } : {}),
        }),
      });
      const code = responseBookingCode(response);
      setSuccess(code ? `تم تثبيت الحجز بنجاح. رمز الحجز: ${code}` : "تم تثبيت الحجز بنجاح.");
      setCustomerName("");
      setCustomerPhone("");
      setPaymentRef("");
      setSelectedSeats([]);
      setPassengerNames({});
      await selectTrip(selectedTrip._id, true);
    } catch (reason) {
      const message = getErrorMessage(reason);
      setError(message);
      if (typeof reason === "object" && reason !== null && "status" in reason && reason.status === 409) {
        await selectTrip(selectedTrip._id, true);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeading eyebrow="منصة الاستقبال" title="حجز سريع" description="اختر رحلة ومقاعد متاحة ثم أدخل بيانات الركاب وطريقة الدفع." />
      {error && <ErrorBanner message={error} />}
      {success && <SuccessBanner message={success} />}
      <section className="card">
        <div className="card-header">
          <div><h2>اختيار الرحلة</h2><p>الرحلات المتاحة حسب التاريخ المحدد.</p></div>
          <div className="toolbar-end"><label className="field"><span>التاريخ</span><input type="date" value={date} onChange={(event) => { setLoadingTrips(true); setManifest(null); setSelectedTripId(""); setSelectedSeats([]); setDate(event.target.value); }} /></label><button className="button button-secondary" onClick={() => { setLoadingTrips(true); void loadTrips(); }}>تحديث</button></div>
        </div>
        <div className="card-body">
          {loadingTrips ? <LoadingState /> : trips.length === 0 ? <EmptyState title="لا توجد رحلات في هذا التاريخ" description="جرّب تاريخاً آخر أو اطلب من الإدارة إنشاء رحلة." /> : (
            <label className="field">
              <span>الرحلة</span>
              <select value={selectedTripId} onChange={(event) => void selectTrip(event.target.value)}>
                <option value="">اختر رحلة</option>
                {trips.map((trip) => <option key={trip._id} value={trip._id}>{trip.from} ← {trip.to} · {formatDate(trip.departureAt)} · {formatMoney(trip.seatPrice)}</option>)}
              </select>
            </label>
          )}
        </div>
      </section>

      {selectedTripId && (
        <form className="booking-layout" onSubmit={(event) => void submit(event)}>
          <section className="card">
            <div className="card-header"><div><h2>اختيار المقاعد</h2><p>المقاعد الرمادية محجوزة مسبقاً.</p></div></div>
            <div className="card-body">
              {loadingManifest ? <LoadingState label="جارٍ تحميل مخطط المقاعد…" /> : selectedBus ? (
                <>
                  <div className="trip-summary">
                    <div><span>المسار</span><strong>{selectedTrip?.from} ← {selectedTrip?.to}</strong></div>
                    <div><span>الانطلاق</span><strong>{selectedTrip ? formatDate(selectedTrip.departureAt) : "—"}</strong></div>
                    <div><span>السعة</span><strong>{getSeatCount(selectedBus.busClass, selectedBus.size)} مقعداً</strong></div>
                  </div>
                  <div className="seat-picker-wrap">
                    <SeatMap
                      busClass={selectedBus.busClass}
                      size={selectedBus.size}
                      bookedSeats={selectedTrip?.bookedSeats ?? []}
                      selectedSeats={selectedSeats}
                      onToggle={toggleSeat}
                    />
                  </div>
                </>
              ) : <EmptyState title="مخطط المقاعد غير متاح" description="تأكد من أن استجابة الرحلة تتضمن بيانات الباص وفئته وحجمه." />}
            </div>
          </section>

          <section className="card">
            <div className="card-header"><div><h2>بيانات الحجز</h2><p>أدخل معلومات التواصل واسم كل راكب.</p></div></div>
            <div className="card-body">
              <div className="field-grid">
                <label className="field"><span>اسم صاحب الحجز</span><input autoComplete="name" required value={customerName} onChange={(event) => setCustomerName(event.target.value)} /></label>
                <label className="field"><span>رقم هاتف صاحب الحجز</span><input autoComplete="tel" inputMode="tel" required value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} /></label>
              </div>
              <h3 className="form-section-title">أسماء الركاب · {selectedSeats.length}</h3>
              {selectedSeats.length ? (
                <div className="passenger-list">
                  {selectedSeats.map((seat) => <label className="passenger-row" key={seat}><span>المقعد {seat}</span><input className="filter-control" required placeholder="اسم الراكب" value={passengerNames[seat] ?? ""} onChange={(event) => setPassengerNames({ ...passengerNames, [seat]: event.target.value })} /></label>)}
                </div>
              ) : <p className="muted-note">حدد المقاعد من المخطط لإضافة الركاب.</p>}
              <h3 className="form-section-title">طريقة الدفع</h3>
              <div className="segmented-control" role="group" aria-label="طريقة الدفع">
                <button type="button" className={`segment-button${paymentMethod === "CASH" ? " active" : ""}`} onClick={() => setPaymentMethod("CASH")}>نقداً</button>
                <button type="button" className={`segment-button${paymentMethod === "SHAM_CASH" ? " active" : ""}`} onClick={() => setPaymentMethod("SHAM_CASH")}>شام كاش</button>
              </div>
              {paymentMethod === "SHAM_CASH" && <label className="field payment-ref-field"><span>رقم عملية شام كاش</span><input required value={paymentRef} onChange={(event) => setPaymentRef(event.target.value)} placeholder="أدخل رقم الحوالة للتحقق" /></label>}
              <div className="booking-total">
                <span>الإجمالي ({selectedSeats.length} مقعد)</span>
                <strong>{formatMoney(total)}</strong>
              </div>
              <button className="button button-primary booking-submit" disabled={busy || loadingManifest || !selectedSeats.length || !selectedBus}>{busy ? "جارٍ تثبيت الحجز…" : "تأكيد الحجز"}</button>
              <p className="muted-note booking-note">يُعاد تحديث مخطط المقاعد عند تعارض حجز متزامن.</p>
            </div>
          </section>
        </form>
      )}
    </>
  );
}
