"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageHeading } from "@/components/ui/page-heading";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
} from "@/components/ui/feedback";
import { apiList, apiRequest } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import type { ReportSummary, Trip } from "@/types/domain";

function todayValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function AdminOverview() {
  const [date, setDate] = useState(todayValue);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [occupancy, setOccupancy] = useState<ReportSummary | null>(null);
  const [revenue, setRevenue] = useState<ReportSummary | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const results = await Promise.allSettled([
      apiList<Trip>(`/staff/trips?date=${encodeURIComponent(date)}`),
      apiRequest<ReportSummary>(`/admin/reports/occupancy?from=${encodeURIComponent(date)}&to=${encodeURIComponent(date)}`),
      apiRequest<ReportSummary>(`/admin/reports/revenue?from=${encodeURIComponent(date)}&to=${encodeURIComponent(date)}`),
    ]);
    const nextErrors: string[] = [];
    if (results[0].status === "fulfilled") setTrips(results[0].value);
    else nextErrors.push(`الرحلات: ${results[0].reason instanceof Error ? results[0].reason.message : "تعذر التحميل"}`);
    if (results[1].status === "fulfilled") setOccupancy(results[1].value);
    else nextErrors.push(`الإشغال: ${results[1].reason instanceof Error ? results[1].reason.message : "تعذر التحميل"}`);
    if (results[2].status === "fulfilled") setRevenue(results[2].value);
    else nextErrors.push(`الإيرادات: ${results[2].reason instanceof Error ? results[2].reason.message : "تعذر التحميل"}`);
    setErrors(nextErrors);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    const request = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(request);
  }, [load]);

  const booked = occupancy?.bookedSeats;
  const totalSeats = occupancy?.totalSeats;
  const occupancyRate =
    occupancy?.occupancyRate ??
    (booked !== undefined && totalSeats ? Math.round((booked / totalSeats) * 100) : null);

  return (
    <>
      <PageHeading
        eyebrow="نظرة عامة"
        title="لوحة التحكم"
        description="تابع حركة الرحلات والإشغال والإيرادات من مكان واحد."
        action={
          <label className="field">
            <span>تاريخ الرحلات</span>
            <input type="date" value={date} onChange={(event) => { setLoading(true); setDate(event.target.value); }} />
          </label>
        }
      />
      {errors.map((message) => <ErrorBanner key={message} message={message} onRetry={() => void load()} />)}
      {loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label="رحلات اليوم" value={trips.length.toLocaleString("ar-SY")} icon="↗" note="حسب التاريخ المحدد" />
            <StatCard label="نسبة الإشغال" value={occupancyRate === null ? "—" : `${occupancyRate}%`} icon="◉" note={booked !== undefined && totalSeats !== undefined ? `${booked} من ${totalSeats} مقعداً` : "بيانات الإشغال"} />
            <StatCard label="الإيرادات" value={revenue?.totalRevenue === undefined ? "—" : formatMoney(revenue.totalRevenue)} icon="ل.س" note="حسب التاريخ المحدد" />
            <StatCard label="الحجوزات المؤكدة" value={(occupancy?.confirmedBookings ?? revenue?.confirmedBookings)?.toLocaleString("ar-SY") ?? "—"} icon="✓" note="على الرحلات المحددة" />
          </div>
          <div className="content-grid">
            <section className="card">
              <div className="card-header">
                <div>
                  <h2>رحلات اليوم</h2>
                  <p>مواعيد الرحلات وحالتها التشغيلية</p>
                </div>
                <Link className="text-link" href="/admin/trips">إدارة الرحلات</Link>
              </div>
              {trips.length ? (
                <div className="table-scroll">
                  <table className="data-table">
                    <thead><tr><th>المسار</th><th>موعد الانطلاق</th><th>المقاعد المحجوزة</th><th>الحالة</th></tr></thead>
                    <tbody>{trips.slice(0, 7).map((trip) => (
                      <tr key={trip._id}>
                        <td><span className="table-main">{trip.from} ← {trip.to}</span></td>
                        <td>{formatDate(trip.departureAt)}</td>
                        <td><span className="seat-count">{trip.bookedSeats?.length ?? 0}</span></td>
                        <td><StatusPill value={trip.status} /></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : <EmptyState title="لا توجد رحلات في هذا التاريخ" description="أنشئ رحلة يدوية أو أضف جدولاً متكرراً لتبدأ." />}
            </section>
            <section className="card">
              <div className="card-header">
                <div>
                  <h2>إجراءات سريعة</h2>
                  <p>الوصول إلى المهام الأكثر استخداماً</p>
                </div>
              </div>
              <div className="card-body action-list">
                <ActionTile href="/admin/trips" title="إنشاء رحلة" description="أضف رحلة جديدة إلى الجدول" />
                <ActionTile href="/admin/schedules" title="إدارة الجداول" description="أنشئ رحلات متكررة تلقائياً" />
                <ActionTile href="/admin/buses" title="إدارة الأسطول" description="حدّث الباصات وحالاتها" />
                <ActionTile href="/admin/reports" title="عرض التقارير" description="راجع الإيرادات ونسب الإشغال" />
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}

function StatCard({ label, value, icon, note }: { label: string; value: string; icon: string; note: string }) {
  return (
    <article className="card stat-card">
      <div className="stat-label"><span>{label}</span><span className="stat-icon">{icon}</span></div>
      <strong className="stat-value">{value}</strong>
      <span className="stat-note">{note}</span>
    </article>
  );
}

function ActionTile({ href, title, description }: { href: string; title: string; description: string }) {
  return <Link className="action-tile" href={href}><span><strong>{title}</strong><span style={{ display: "block", marginTop: 4 }}>{description}</span></span><b aria-hidden="true">←</b></Link>;
}

function StatusPill({ value }: { value: string }) {
  const statusLabels: Record<string, { label: string; style: string }> = {
    SCHEDULED: { label: "مجدولة", style: "" },
    DEPARTED: { label: "انطلقت", style: "warning" },
    ARRIVED: { label: "وصلت", style: "neutral" },
    CANCELLED: { label: "ملغاة", style: "danger" },
  };
  const status = statusLabels[value] ?? { label: value, style: "neutral" };
  return <span className={`status-pill ${status.style}`}>{status.label}</span>;
}
