"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PageHeading } from "@/components/ui/page-heading";
import { ErrorBanner } from "@/components/ui/feedback";
import { apiRequest, jsonBody } from "@/lib/api";
import { getErrorMessage } from "@/lib/format";

export function ReceptionistCreatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiRequest<unknown>("/admin/receptionists", {
        method: "POST",
        body: jsonBody({ name: name.trim(), phone: phone.trim(), password }),
      });
      router.push("/admin/receptionists");
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeading title="إضافة موظف استقبال" description="أنشئ حساباً لفريق الاستقبال لإدارة حجوزات المكتب." />
      <section className="card form-card">
        <div className="card-header"><div><h2>بيانات الموظف</h2><p>سيُمنح الحساب صلاحية الاستقبال فقط.</p></div></div>
        <div className="card-body">
          {error && <ErrorBanner message={error} />}
          <form onSubmit={submit}>
            <div className="field-grid">
              <label className="field"><span>الاسم الكامل</span><input autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} /></label>
              <label className="field"><span>رقم الهاتف</span><input autoComplete="tel" inputMode="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
              <label className="field"><span>كلمة المرور</span><input autoComplete="new-password" minLength={8} required type="password" value={password} onChange={(event) => setPassword(event.target.value)} /><small className="field-hint">ثمانية أحرف على الأقل.</small></label>
            </div>
            <div className="form-actions"><button className="button button-primary" disabled={busy}>{busy ? "جارٍ إنشاء الحساب…" : "إنشاء الحساب"}</button><Link className="button button-secondary" href="/admin/receptionists">إلغاء</Link></div>
          </form>
        </div>
      </section>
    </>
  );
}

