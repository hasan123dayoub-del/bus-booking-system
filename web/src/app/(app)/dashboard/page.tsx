"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Icon } from "@/components/icon";
import { Alert, ClassBadge, Empty, Field, Loading, Modal, PageHeader, Pill, Segmented, TRIP_TONE, Toggle } from "@/components/ui";
import { api, errorMessage, qs } from "@/lib/api";
import {
  TRIP_STATUS_LABEL,
  WEEKDAYS,
  addDays,
  cityName,
  money,
  number,
  phone as formatPhone,
  timeOf,
  today,
} from "@/lib/format";
import type { OccupancyReport, RevenueReport, Summary, Trip, User } from "@/lib/types";

type Period = "DAY" | "WEEK" | "MONTH";

export default function DashboardPage() {
  const day = today();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [period, setPeriod] = useState<Period>("WEEK");
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [routes, setRoutes] = useState<OccupancyReport | null>(null);
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [staff, setStaff] = useState<User[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const loadStaff = useCallback(async () => {
    setStaff(await api.get<User[]>("/admin/receptionists"));
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const [s, occ, tr] = await Promise.all([
          api.get<Summary>(`/admin/reports/summary${qs({ date: day })}`),
          api.get<OccupancyReport>(`/admin/reports/occupancy${qs({ from: addDays(day, -6), to: day })}`),
          api.get<Trip[]>(`/staff/trips${qs({ date: day })}`),
          loadStaff(),
        ]);
        setSummary(s);
        setRoutes(occ);
        setTrips(tr);
      } catch (err) {
        setError(errorMessage(err));
      }
    }, 0);
    return () => clearTimeout(t);
  }, [day, loadStaff]);

  useEffect(() => {
    const from = period === "DAY" ? day : addDays(day, period === "WEEK" ? -6 : -29);
    const t = setTimeout(async () => {
      try {
        setRevenue(await api.get<RevenueReport>(`/admin/reports/revenue${qs({ from, to: day })}`));
      } catch (err) {
        setError(errorMessage(err));
      }
    }, 0);
    return () => clearTimeout(t);
  }, [period, day]);

  async function toggleStaff(u: User, active: boolean) {
    setStaff((list) => list?.map((x) => (x._id === u._id ? { ...x, active } : x)) ?? null);
    try {
      await api.patch(`/admin/receptionists/${u._id}`, { active });
    } catch (err) {
      setError(errorMessage(err));
      void loadStaff();
    }
  }

  return (
    <>
      <PageHeader title="لوحة التحكم" subtitle="نظرة عامة على رحلات اليوم والإشغال والإيرادات" />
      {error && <Alert onClose={() => setError("")}>{error}</Alert>}

      <div className="stats">
        <StatCard
          icon="route"
          tone="purple"
          label="رحلات اليوم"
          value={summary ? number(summary.trips.total) : "—"}
          note={summary ? `${number(summary.trips.departed)} قيد الانطلاق` : ""}
          trend={summary ? 1 : 0}
        />
        <StatCard
          icon="percent"
          tone="blue"
          label="نسبة الإشغال"
          value={summary ? `${summary.occupancy.rate}%` : "—"}
          note={summary ? `${signed(summary.occupancy.change)} نقاط` : ""}
          trend={summary?.occupancy.change ?? 0}
        />
        <StatCard
          icon="bag"
          tone="amber"
          label="الإيرادات اليوم"
          value={summary ? money(summary.revenue.total) : "—"}
          note={summary?.revenue.changePercent != null ? `${signed(summary.revenue.changePercent)}% عن أمس` : "لا بيانات لأمس"}
          trend={summary?.revenue.changePercent ?? 0}
        />
        <StatCard
          icon="ticket"
          tone="green"
          label="حجوزات اليوم"
          value={summary ? number(summary.bookings.total) : "—"}
          note={summary?.bookings.changePercent != null ? `${signed(summary.bookings.changePercent)}% عن أمس` : "لا بيانات لأمس"}
          trend={summary?.bookings.changePercent ?? 0}
        />
      </div>

      <div className="dash-grid">
        <section className="card panel">
          <div className="panel-head">
            <h2>
              {period === "DAY" ? "الإيرادات اليوم حسب الساعة" : period === "WEEK" ? "الإيرادات خلال الأسبوع" : "الإيرادات خلال الشهر"} (مليون ل.س)
            </h2>
            <Segmented
              className="small"
              value={period}
              onChange={setPeriod}
              options={[
                { value: "DAY", label: "اليوم" },
                { value: "WEEK", label: "الأسبوع" },
                { value: "MONTH", label: "الشهر" },
              ]}
            />
          </div>
          {revenue ? <RevenueChart report={revenue} period={period} day={day} /> : <Loading />}
        </section>

        <section className="card panel">
          <div className="panel-head">
            <h2>الإشغال حسب الخط</h2>
            <span className="muted small">آخر 7 أيام</span>
          </div>
          {!routes ? (
            <Loading />
          ) : !routes.byRoute.length ? (
            <Empty title="لا توجد رحلات في هذه الفترة" />
          ) : (
            <ul className="route-bars">
              {routes.byRoute.slice(0, 5).map((r) => (
                <li key={`${r.from}-${r.to}`}>
                  <div className="route-bar-head">
                    <span>{cityName(r.from)} – {cityName(r.to)}</span>
                    <b className={rateTone(r.rate)}>{r.rate}%</b>
                  </div>
                  <div className="bar-track">
                    <span className={`bar-fill ${rateTone(r.rate)}`} style={{ width: `${r.rate}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card panel">
          <div className="panel-head">
            <h2>رحلات اليوم</h2>
            <Link href="/trips" className="link-btn">عرض كل الرحلات</Link>
          </div>
          {!trips ? (
            <Loading />
          ) : !trips.length ? (
            <Empty icon="route" title="لا توجد رحلات اليوم" />
          ) : (
            <div className="table-scroll">
              <table className="table compact">
                <thead>
                  <tr>
                    <th>الوقت</th>
                    <th>الخط</th>
                    <th>الباص</th>
                    <th>الدرجة</th>
                    <th>الإشغال</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((t) => (
                    <tr key={t._id}>
                      <td className="time-cell">{timeOf(t.departureAt)}</td>
                      <td>{cityName(t.from)} ← {cityName(t.to)}</td>
                      <td>{t.bus?.plateNumber ?? "—"}</td>
                      <td>{t.bus && <ClassBadge value={t.bus.busClass} />}</td>
                      <td dir="ltr" className="occ-cell">{t.bookedSeats.length}/{t.totalSeats}</td>
                      <td><Pill tone={TRIP_TONE[t.status]}>{TRIP_STATUS_LABEL[t.status]}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card panel">
          <div className="panel-head">
            <h2>موظفو الاستقبال</h2>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>
              <Icon name="plus" size={16} />
              إضافة موظف
            </button>
          </div>
          {!staff ? (
            <Loading />
          ) : !staff.length ? (
            <Empty icon="user" title="لا يوجد موظفو استقبال" text="أضف أول موظف ليبدأ الحجز من المكتب." />
          ) : (
            <ul className="staff-list">
              {staff.map((u) => (
                <li key={u._id}>
                  <span className="staff-avatar"><Icon name="user" size={18} /></span>
                  <span className="staff-text">
                    <strong>{u.name}</strong>
                    <span className="muted small" dir="ltr">{formatPhone(u.phone)}</span>
                  </span>
                  <Toggle checked={u.active} label={`تفعيل حساب ${u.name}`} onChange={(v) => void toggleStaff(u, v)} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {adding && (
        <AddReceptionist
          onClose={() => setAdding(false)}
          onCreated={() => {
            setAdding(false);
            void loadStaff();
          }}
        />
      )}
    </>
  );
}

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));
const rateTone = (rate: number) => (rate >= 80 ? "high" : rate >= 70 ? "mid" : "low");

function StatCard({
  icon,
  tone,
  label,
  value,
  note,
  trend,
}: {
  icon: string;
  tone: string;
  label: string;
  value: string;
  note: string;
  trend: number;
}) {
  return (
    <article className="card stat">
      <div className="stat-text">
        <span className="muted small">{label}</span>
        <strong>{value}</strong>
        <span className={`stat-note ${trend < 0 ? "down" : ""}`}>
          {note && <Icon name={trend < 0 ? "trendDown" : "trend"} size={14} />}
          {note}
        </span>
      </div>
      <span className={`stat-icon ${tone}`}>
        <Icon name={icon} size={22} />
      </span>
    </article>
  );
}

function RevenueChart({ report, period, day }: { report: RevenueReport; period: Period; day: string }) {
  const points =
    period === "DAY"
      ? (report.byHour ?? []).filter((h) => h.hour >= 6).map((h) => ({ key: String(h.hour), label: `${h.hour}`, value: h.total, today: false }))
      : report.byDay.map((d, i) => ({
          key: d.date,
          label:
            d.date === day
              ? "اليوم"
              : period === "WEEK"
                ? WEEKDAYS[new Date(`${d.date}T12:00:00Z`).getUTCDay()]
                : i % 5 === 0
                  ? String(Number(d.date.slice(8)))
                  : "",
          value: d.total,
          today: d.date === day,
        }));
  const max = Math.max(1, ...points.map((p) => p.value));
  const millions = (v: number) => String(Number((v / 1e6).toFixed(2)));

  if (!points.some((p) => p.value)) return <Empty icon="bag" title="لا توجد إيرادات في هذه الفترة" />;
  return (
    <div className={`chart ${period.toLowerCase()}`}>
      {points.map((p) => (
        <div key={p.key} className="chart-col">
          {period !== "MONTH" && <span className={`chart-value${p.today ? " strong" : ""}`}>{p.value ? millions(p.value) : ""}</span>}
          <span
            className={`chart-bar${p.today ? " today" : ""}`}
            style={{ height: `${Math.max(2, (p.value / max) * 100)}%` }}
            title={money(p.value)}
          />
          <span className="chart-label">{p.label}</span>
        </div>
      ))}
    </div>
  );
}

function AddReceptionist({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/admin/receptionists", { name: name.trim(), phone: phone.trim(), password });
      onCreated();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="إضافة موظف استقبال" subtitle="سيتمكّن من الحجز واستلام الدفع فقط" onClose={onClose}>
      <form onSubmit={submit} className="form-stack">
        {error && <Alert>{error}</Alert>}
        <Field label="الاسم الكامل" icon="user">
          <input required minLength={2} autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="رقم الهاتف" icon="phone">
          <input required dir="ltr" inputMode="tel" placeholder="09xx xxx xxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="كلمة المرور المؤقتة" icon="lock" hint="6 أحرف على الأقل، سلّمها للموظف ليدخل بها">
          <input required minLength={6} type="password" autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <div className="role-row">
          <span className="muted small">الدور</span>
          <span className="badge badge-green">موظف استقبال</span>
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary btn-grow" disabled={busy}>
            <Icon name="check" size={18} />
            {busy ? "جارٍ الإنشاء…" : "إنشاء الحساب"}
          </button>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            إلغاء
          </button>
        </div>
      </form>
    </Modal>
  );
}
