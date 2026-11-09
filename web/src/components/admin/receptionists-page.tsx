"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageHeading } from "@/components/ui/page-heading";
import { EmptyState, ErrorBanner, LoadingState, SuccessBanner } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { apiList, apiRequest, jsonBody } from "@/lib/api";
import { getErrorMessage } from "@/lib/format";
import type { User } from "@/types/domain";

export function ReceptionistsPage() {
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const rows = await apiList<User>("/admin/receptionists");
      setStaff(rows);
      setPageError("");
    } catch (reason) {
      setPageError(getErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const request = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(request);
  }, [load]);

  function openEdit(user: User) {
    setEditing(user);
    setName(user.name);
    setPhone(user.phone);
    setActive(user.active ?? true);
    setActionError("");
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    setActionError("");
    try {
      await apiRequest<unknown>(`/admin/receptionists/${encodeURIComponent(editing._id)}`, {
        method: "PATCH",
        body: jsonBody({ name: name.trim(), phone: phone.trim(), active }),
      });
      setEditing(null);
      setSuccess("تم تحديث بيانات موظف الاستقبال.");
      await load();
    } catch (reason) {
      setActionError(getErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function remove(user: User) {
    if (!window.confirm(`حذف حساب ${user.name}؟`)) return;
    setActionError("");
    try {
      await apiRequest<void>(`/admin/receptionists/${encodeURIComponent(user._id)}`, { method: "DELETE" });
      setSuccess("تم حذف الحساب.");
      await load();
    } catch (reason) {
      setActionError(getErrorMessage(reason));
    }
  }

  return (
    <>
      <PageHeading title="موظفو الاستقبال" description="إدارة حسابات فريق الاستقبال وصلاحياتهم." action={<Link className="button button-primary" href="/admin/receptionists/new"><span>＋</span>إضافة موظف</Link>} />
      {actionError && <ErrorBanner message={actionError} />}
      {success && <SuccessBanner message={success} />}
      <section className="card">
        <div className="toolbar"><div className="toolbar-start"><strong>{staff.length.toLocaleString("ar-SY")} موظف</strong></div><div className="toolbar-end"><button className="button button-secondary" onClick={() => { setLoading(true); void load(); }}>تحديث</button></div></div>
        {loading ? <LoadingState /> : pageError ? <div className="card-body"><ErrorBanner message={pageError} onRetry={() => void load()} /></div> : !staff.length ? <EmptyState title="لا يوجد موظفو استقبال" description="أضف حساباً جديداً لمنح فريقك صلاحية الحجز." /> : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>الموظف</th><th>رقم الهاتف</th><th>الدور</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
              <tbody>{staff.map((user) => (
                <tr key={user._id}>
                  <td><span className="table-main">{user.name}</span></td>
                  <td>{user.phone}</td>
                  <td>موظف استقبال</td>
                  <td><span className={`status-pill ${user.active === false ? "neutral" : ""}`}>{user.active === false ? "غير نشط" : "نشط"}</span></td>
                  <td><div className="table-actions"><button className="icon-button" aria-label="تعديل الموظف" onClick={() => openEdit(user)}>✎</button><button className="icon-button" aria-label="حذف الموظف" onClick={() => void remove(user)}>×</button></div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
      {editing && <Modal title="تعديل حساب الموظف" onClose={() => setEditing(null)}>
        {actionError && <ErrorBanner message={actionError} />}
        <form onSubmit={save}>
          <div className="field-grid">
            <label className="field"><span>الاسم</span><input required value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label className="field"><span>رقم الهاتف</span><input required inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
          </div>
          <label className="check-field"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /><span>الحساب نشط</span></label>
          <div className="form-actions"><button className="button button-primary" disabled={busy}>{busy ? "جارٍ الحفظ…" : "حفظ التعديلات"}</button><button type="button" className="button button-secondary" onClick={() => setEditing(null)}>إلغاء</button></div>
        </form>
      </Modal>}
    </>
  );
}
