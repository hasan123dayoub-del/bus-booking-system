"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ErrorBanner } from "@/components/ui/feedback";
import { BrandMark } from "@/components/layout/brand-mark";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login, error: sessionError, logout } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const session = await login(phone.trim(), password);
      if (session.user.role === "ADMIN") router.replace("/admin");
      else if (session.user.role === "RECEPTIONIST") {
        router.replace("/reception/booking");
      } else {
        logout();
        setError("حسابات الزبائن تستخدم تطبيق الهاتف ولا يمكنها الدخول إلى هذه المنصة.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر تسجيل الدخول");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page" dir="rtl">
      <section className="login-form-side">
        <div className="login-form-wrap">
          <Link className="brand-lockup" href="/login">
            <BrandMark />
            <span>
              <strong>رحلتي</strong>
              <small>نظام إدارة الرحلات والحجوزات</small>
            </span>
          </Link>
          <h1>مرحباً بعودتك</h1>
          <p>سجّل الدخول إلى حسابك لمتابعة إدارة الرحلات والحجوزات.</p>
          {(error || sessionError) && (
            <ErrorBanner message={error || sessionError || ""} />
          )}
          <form className="login-form" onSubmit={submit}>
            <label className="field">
              <span>رقم الهاتف</span>
              <input
                autoComplete="username"
                inputMode="tel"
                placeholder="أدخل رقم الهاتف"
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </label>
            <label className="field">
              <span>كلمة المرور</span>
              <input
                autoComplete="current-password"
                placeholder="أدخل كلمة المرور"
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button className="button button-primary" disabled={busy} type="submit">
              {busy ? "جارٍ تسجيل الدخول…" : "تسجيل الدخول"}
            </button>
          </form>
          <p className="muted-note" style={{ marginTop: 18 }}>
            الدخول مخصص لحسابات الإدارة وموظفي الاستقبال.
          </p>
        </div>
      </section>
      <aside className="login-aside">
        <div className="login-aside-content">
          <BrandMark />
          <h2>رحلتك تبدأ من هنا.</h2>
          <p>
            منصة واحدة لإدارة الأسطول والرحلات والجداول والحجوزات، مع تجربة
            بسيطة لفريقك وموثوقة لركابك.
          </p>
          <div className="login-feature-list">
            <span>إدارة الرحلات</span>
            <span>حجز سريع</span>
            <span>تقارير واضحة</span>
          </div>
        </div>
      </aside>
    </main>
  );
}
