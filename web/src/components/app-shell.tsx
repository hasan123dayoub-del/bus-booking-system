"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Icon } from "./icon";
import { homeFor, useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";

const NAV: { href: string; label: string; icon: string; roles: Role[] }[] = [
  { href: "/dashboard", label: "الرئيسية", icon: "grid", roles: ["ADMIN"] },
  { href: "/booking", label: "حجز الاستقبال", icon: "ticket", roles: ["ADMIN", "RECEPTIONIST"] },
  { href: "/bookings", label: "الحجوزات", icon: "list", roles: ["ADMIN", "RECEPTIONIST"] },
  { href: "/buses", label: "الباصات", icon: "bus", roles: ["ADMIN"] },
  { href: "/trips", label: "الرحلات والجداول", icon: "route", roles: ["ADMIN"] },
];

/** Pages only the admin may open. */
const ADMIN_ONLY = ["/dashboard", "/buses", "/trips"];

export function BrandMark({ size = 44 }: { size?: number }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size }}>
      <Icon name="bus" size={size * 0.5} />
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { session, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const role = session?.user.role;
  const blocked = role !== undefined && role !== "ADMIN" && ADMIN_ONLY.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (loading) return;
    if (!session || session.user.role === "CUSTOMER") router.replace("/login");
    else if (blocked) router.replace(homeFor(session.user.role));
  }, [loading, session, blocked, router]);

  if (loading || !session || role === "CUSTOMER" || blocked) {
    return (
      <main className="screen-center">
        <span className="spinner" />
      </main>
    );
  }

  const isAdmin = role === "ADMIN";
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href={homeFor(session.user.role)} className="brand">
          <BrandMark />
          <span>
            <strong>رحلتي</strong>
            <small>{isAdmin ? "لوحة الإدارة" : "لوحة الاستقبال"}</small>
          </span>
        </Link>

        <nav className="nav" aria-label="القائمة الرئيسية">
          {NAV.filter((n) => n.roles.includes(session.user.role)).map((n) => {
            const active = pathname === n.href || pathname.startsWith(`${n.href}/`);
            return (
              <Link key={n.href} href={n.href} className={`nav-link${active ? " active" : ""}`} aria-current={active ? "page" : undefined}>
                <Icon name={n.icon} size={20} />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="user-card">
          <span className="avatar">
            <Icon name="user" size={18} />
          </span>
          <span className="user-text">
            <strong>{session.user.name}</strong>
            <small>{isAdmin ? "Admin" : "موظف استقبال"}</small>
          </span>
          <button
            type="button"
            className="logout"
            aria-label="تسجيل الخروج"
            title="تسجيل الخروج"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
          >
            <Icon name="logout" size={20} />
          </button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
