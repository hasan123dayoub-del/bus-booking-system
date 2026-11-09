"use client";

import { useState, type FormEvent } from "react";
import type { ReactNode } from "react";
import { PageHeading } from "@/components/ui/page-heading";
import { EmptyState, ErrorBanner, LoadingState } from "@/components/ui/feedback";
import { apiRequest } from "@/lib/api";
import { formatMoney, getErrorMessage } from "@/lib/format";
import type { ReportSummary } from "@/types/domain";

function monthStart() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function todayValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function ReportsPage() {
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(todayValue);
  const [occupancy, setOccupancy] = useState<ReportSummary | null>(null);
  const [revenue, setRevenue] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  async function search(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (from > to) {
      setErrors(["تاريخ البداية يجب أن يسبق تاريخ النهاية."]);
      return;
    }
    setLoading(true);
    setErrors([]);
    setHasSearched(true);
    const query = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const result = await Promise.allSettled([
      apiRequest<ReportSummary>(`/admin/reports/occupancy${query}`),
      apiRequest<ReportSummary>(`/admin/reports/revenue${query}`),
    ]);
    const nextErrors: string[] = [];
    if (result[0].status === "fulfilled") setOccupancy(result[0].value);
    else nextErrors.push(`تقرير الإشغال: ${getErrorMessage(result[0].reason)}`);
    if (result[1].status === "fulfilled") setRevenue(result[1].value);
    else nextErrors.push(`تقرير الإيرادات: ${getErrorMessage(result[1].reason)}`);
    setErrors(nextErrors);
    setLoading(false);
  }

  const rate =
    occupancy?.occupancyRate ??
    (occupancy?.bookedSeats !== undefined && occupancy.totalSeats
      ? Math.round((occupancy.bookedSeats / occupancy.totalSeats) * 100)
      : undefined);

  return (
    <>
      <PageHeading title="التقارير" description="تابع الإيرادات ونسب إشغال الرحلات خلال فترة محددة." />
      <section className="card report-filter-card">
        <form className="inline-form" onSubmit={(event) => void search(event)}>
          <label className="field"><span>من تاريخ</span><input type="date" required value={from} onChange={(event) => setFrom(event.target.value)} /></label>
          <label className="field"><span>إلى تاريخ</span><input type="date" required min={from} value={to} onChange={(event) => setTo(event.target.value)} /></label>
          <button className="button button-primary" disabled={loading}>{loading ? "جارٍ إنشاء التقرير…" : "عرض التقرير"}</button>
        </form>
      </section>
      {!!errors.length && errors.map((message) => <ErrorBanner key={message} message={message} onRetry={() => void search()} />)}
      {loading ? <LoadingState label="جارٍ تحميل التقارير…" /> : !hasSearched ? (
        <div className="card" style={{ marginTop: 16 }}><EmptyState title="اختر الفترة الزمنية" description="حدد تاريخ البداية والنهاية لعرض بيانات الإيرادات والإشغال." /></div>
      ) : (
        <div className="report-grid">
          <ReportCard title="تقرير الإشغال" subtitle={`من ${from} إلى ${to}`}>
            {occupancy ? (
              <>
                <div className="report-summary">
                  <ReportStat label="نسبة الإشغال" value={rate === undefined ? "—" : `${rate}%`} />
                  <ReportStat label="المقاعد المحجوزة" value={occupancy.bookedSeats?.toLocaleString("ar-SY") ?? "—"} />
                  <ReportStat label="إجمالي المقاعد" value={occupancy.totalSeats?.toLocaleString("ar-SY") ?? "—"} />
                  <ReportStat label="عدد الرحلات" value={occupancy.totalTrips?.toLocaleString("ar-SY") ?? "—"} />
                </div>
                {rate !== undefined && <div className="progress-track" role="img" aria-label={`نسبة الإشغال ${rate}%`}><span style={{ width: `${Math.min(100, Math.max(0, rate))}%` }} /></div>}
              </>
            ) : <EmptyState title="لم تتوفر بيانات الإشغال" description="تحقق من استجابة واجهة التقارير." />}
          </ReportCard>
          <ReportCard title="تقرير الإيرادات" subtitle={`من ${from} إلى ${to}`}>
            {revenue ? (
              <div className="revenue-highlight">
                <span>إجمالي الإيرادات</span>
                <strong>{revenue.totalRevenue === undefined ? "—" : formatMoney(revenue.totalRevenue)}</strong>
                <div className="report-summary">
                  <ReportStat label="الحجوزات المؤكدة" value={revenue.confirmedBookings?.toLocaleString("ar-SY") ?? "—"} />
                  <ReportStat label="عدد الرحلات" value={revenue.totalTrips?.toLocaleString("ar-SY") ?? "—"} />
                </div>
              </div>
            ) : <EmptyState title="لم تتوفر بيانات الإيرادات" description="تحقق من استجابة واجهة التقارير." />}
          </ReportCard>
        </div>
      )}
    </>
  );
}

function ReportCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <section className="card"><div className="card-header"><div><h2>{title}</h2><p>{subtitle}</p></div></div><div className="card-body">{children}</div></section>;
}

function ReportStat({ label, value }: { label: string; value: string }) {
  return <div className="report-stat"><span>{label}</span><strong>{value}</strong></div>;
}
