"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { BrandMark } from "@/components/layout/brand-mark";
import type { Role } from "@/types/domain";

interface AppShellProps {
  children: ReactNode;
  role: "ADMIN" | "RECEPTIONIST";
}

const adminLinks = [
  { href: "/admin", label: "لوحة التحكم", icon: "dashboard" },
  { href: "/admin/buses", label: "الباصات", icon: "bus" },
  { href: "/admin/trips", label: "الرحلات", icon: "route" },
  { href: "/admin/schedules", label: "الجداول المجدولة", icon: "calendar" },
  { href: "/admin/receptionists", label: "موظفو الاستقبال", icon: "users" },
  { href: "/admin/reports", label: "التقارير", icon: "chart" },
];

const receptionistLinks = [
  { href: "/reception/booking", label: "حجز سريع", icon: "plus" },
  { href: "/reception/bookings", label: "الرحلات والركاب", icon: "ticket" },
];

export function AppShell({ children, role }: AppShellProps) {
  const { session, loading, error, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const links = role === "ADMIN" ? adminLinks : receptionistLinks;
  const home = role === "ADMIN" ? "/admin" : "/reception/booking";

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
    else if (!loading && session && session.user.role !== role) {
      router.replace(session.user.role === "ADMIN" ? "/admin" : "/reception/booking");
    }
  }, [loading, role, router, session]);

  if (loading || !session || session.user.role !== role) {
    return (
      <main className="screen-state" dir="rtl">
        <span className="spinner" aria-hidden="true" />
        <p>{error ?? "جارٍ التحقق من الجلسة…"}</p>
        {error && <Link className="text-link" href="/login">العودة لتسجيل الدخول</Link>}
      </main>
    );
  }

  return (
    <div className="app-shell" dir="rtl">
      <aside className="sidebar">
        <Link className="brand-lockup" href={home} aria-label="رحلتي - الرئيسية">
          <BrandMark />
          <span>
            <strong>رحلتي</strong>
            <small>{role === "ADMIN" ? "منصة الإدارة" : "منصة الاستقبال"}</small>
          </span>
        </Link>

        <div className="side-section-label">القائمة الرئيسية</div>
        <nav className="side-nav" aria-label="التنقل الرئيسي">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== home && pathname.startsWith(`${link.href}/`));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`side-link${active ? " active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <NavGlyph name={link.icon} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-dot" />
            <div>
              <strong>نظام رحلتي</strong>
              <p>إدارة رحلاتك بكل سهولة</p>
            </div>
          </div>
          <button
            className="side-link signout-button"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
          >
            <NavGlyph name="logout" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>رحلتي</span>
            <span className="crumb-separator">/</span>
            <span>{links.find((link) => pathname === link.href || (link.href !== home && pathname.startsWith(`${link.href}/`)))?.label ?? "الرئيسية"}</span>
          </div>
          <div className="profile-menu">
            <span className="avatar">{session.user.name.slice(0, 1)}</span>
            <span className="profile-copy">
              <strong>{session.user.name}</strong>
              <small>{role === "ADMIN" ? "مدير النظام" : "موظف استقبال"}</small>
            </span>
          </div>
        </header>
        <main className="page-content">{children}</main>
        <footer className="app-footer">
          <span>© {new Date().getFullYear()} رحلتي</span>
          <span>رحلات آمنة وحجوزات موثوقة</span>
        </footer>
      </div>
    </div>
  );
}

function NavGlyph({ name }: { name: string }) {
  const common = {
    className: "nav-icon h-5 w-5",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  const drawings: Record<string, ReactNode> = {
    dashboard: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    bus: <><path d="M5 18V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12" /><path d="M5 11h14M5 16h14M8 20v-2m8 2v-2M8 7h3m2 0h3" /><circle cx="8" cy="15" r=".75" fill="currentColor" /><circle cx="16" cy="15" r=".75" fill="currentColor" /></>,
    route: <><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h3a3 3 0 0 0 3-3v-2a3 3 0 0 1 3-3h1" /><path d="m15 6 1.3 1.3L18 6l-1.7-1.3L15 6Z" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17M8 13h2m4 0h2m-8 3.5h2m4 0h2" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20v-1.5a5.5 5.5 0 0 1 11 0V20zM16 5.5a3 3 0 0 1 0 5.8m2 2a4.5 4.5 0 0 1 2.5 4.1V20h-3" /></>,
    chart: <><path d="M4 20V4m0 16h16" /><rect x="7" y="12" width="3" height="5" rx="1" /><rect x="12" y="8" width="3" height="9" rx="1" /><rect x="17" y="5" width="3" height="12" rx="1" /></>,
    plus: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8m-4-4h8" /></>,
    ticket: <><path d="M4 7.5a2 2 0 0 0 0 4v5A1.5 1.5 0 0 0 5.5 18h13a1.5 1.5 0 0 0 1.5-1.5v-5a2 2 0 0 0 0-4V6.5A1.5 1.5 0 0 0 18.5 5h-13A1.5 1.5 0 0 0 4 6.5z" /><path d="M14 5v2m0 2v2m0 2v2m0 2v2" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3.5" /><path d="M12 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" /></>,
  };

  return <svg {...common}>{drawings[name] ?? drawings.dashboard}</svg>;
}

export function isAllowedRole(role: Role, allowed: Role[]) {
  return allowed.includes(role);
}
