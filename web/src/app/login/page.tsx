"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { BrandMark } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { Alert, Field } from "@/components/ui";
import { errorMessage } from "@/lib/api";
import { homeFor, useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { session, loading, login, logout } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Already signed in: go straight to the dashboard
  useEffect(() => {
    if (!loading && session && session.user.role !== "CUSTOMER") router.replace(homeFor(session.user.role));
  }, [loading, session, router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const s = await login(phone.trim(), password, remember);
      if (s.user.role === "CUSTOMER") {
        logout();
        setError("حسابات الزبائن تستخدم تطبيق الهاتف، هذه اللوحة للإدارة والاستقبال فقط.");
        return;
      }
      router.replace(homeFor(s.user.role));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login">
      <section className="login-side">
        <form className="login-form" onSubmit={submit}>
          <div className="login-brand">
            <BrandMark size={50} />
            <strong>رحلتي</strong>
          </div>
          <h1>تسجيل دخول الموظفين</h1>
          <p className="login-sub">سجّل الدخول إلى لوحة الإدارة والاستقبال</p>

          {error && <Alert>{error}</Alert>}

          <Field label="رقم الهاتف" icon="phone">
            <input
              dir="ltr"
              inputMode="tel"
              autoComplete="username"
              placeholder="09xx xxx xxx"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <Field label="كلمة المرور" icon="lock">
            <input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          <label className="checkbox">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span className="box">
              <Icon name="check" size={13} />
            </span>
            تذكّرني على هذا الجهاز
          </label>

          <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
            {busy ? "جارٍ تسجيل الدخول…" : "تسجيل الدخول"}
            <Icon name="arrowLeft" size={18} />
          </button>

          <p className="login-note">
            <Icon name="shield" size={16} />
            هذه اللوحة مخصصة للإدارة وموظفي الاستقبال فقط
          </p>
        </form>
      </section>

      <aside className="login-hero">
        {/* The picture already contains the slogan and the feature chips */}
        <h2 className="sr-only">كل رحلات شركتك في مكان واحد</h2>
        <p className="sr-only">أنشئ الرحلات، وأدر الباصات، واحجز للزبائن من المكتب بنقرات قليلة.</p>
      </aside>
    </main>
  );
}
