"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PageHeading } from "@/components/ui/page-heading";
import { ErrorBanner, EmptyState, LoadingState, SuccessBanner } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { apiList, apiRequest, jsonBody } from "@/lib/api";
import { busClassLabels, busSizeLabels, busStatusLabels, getErrorMessage } from "@/lib/format";
import type { Bus, BusClass, BusSize, BusStatus } from "@/types/domain";

interface BusForm {
  plateNumber: string;
  busClass: BusClass;
  size: BusSize;
  status: BusStatus;
}

const emptyForm: BusForm = {
  plateNumber: "",
  busClass: "REGULAR",
  size: "LARGE",
  status: "ACTIVE",
};

export function BusesPage() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Bus | null>(null);
  const [form, setForm] = useState<BusForm>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const rows = await apiList<Bus>("/admin/buses");
      setBuses(rows);
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

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setActionError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEdit(bus: Bus) {
    setEditing(bus);
    setForm({
      plateNumber: bus.plateNumber,
      busClass: bus.busClass,
      size: bus.size,
      status: bus.status,
    });
    setActionError("");
    setSuccess("");
    setModalOpen(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setActionError("");
    try {
      await apiRequest<unknown>(
        editing ? `/admin/buses/${encodeURIComponent(editing._id)}` : "/admin/buses",
        {
          method: editing ? "PATCH" : "POST",
          body: jsonBody(form),
        },
      );
      setModalOpen(false);
      setSuccess(editing ? "تم تحديث بيانات الباص." : "تمت إضافة الباص.");
      await load();
    } catch (reason) {
      setActionError(getErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function remove(bus: Bus) {
    if (!window.confirm(`هل تريد حذف الباص ${bus.plateNumber}؟`)) return;
    setActionError("");
    setSuccess("");
    try {
      await apiRequest<void>(`/admin/buses/${encodeURIComponent(bus._id)}`, { method: "DELETE" });
      setSuccess("تم حذف الباص.");
      await load();
    } catch (reason) {
      setActionError(getErrorMessage(reason));
    }
  }

  const filtered = buses.filter((bus) =>
    `${bus.plateNumber} ${busClassLabels[bus.busClass]}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <PageHeading
        title="إدارة الباصات"
        description="أدر الأسطول وأنواع الباصات ومخططات المقاعد."
        action={<button className="button button-primary" onClick={openCreate}><span>＋</span>إضافة باص</button>}
      />
      {actionError && <ErrorBanner message={actionError} />}
      {success && <SuccessBanner message={success} />}
      <section className="card">
        <div className="toolbar">
          <div className="toolbar-start"><strong>{buses.length.toLocaleString("ar-SY")} باص</strong></div>
          <div className="toolbar-end">
            <input className="filter-control" placeholder="ابحث برقم اللوحة أو الفئة" value={query} onChange={(event) => setQuery(event.target.value)} />
            <button className="button button-secondary" onClick={() => { setLoading(true); void load(); }}>تحديث</button>
          </div>
        </div>
        {loading ? <LoadingState /> : pageError ? <div className="card-body"><ErrorBanner message={pageError} onRetry={() => void load()} /></div> : filtered.length === 0 ? <EmptyState title="لا توجد باصات مطابقة" description="أضف باصاً جديداً أو غيّر كلمات البحث." /> : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>رقم اللوحة</th><th>الفئة</th><th>الحجم والمقاعد</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
              <tbody>{filtered.map((bus) => (
                <tr key={bus._id}>
                  <td><span className="table-main">{bus.plateNumber}</span></td>
                  <td>{busClassLabels[bus.busClass]}</td>
                  <td>{busSizeLabels[bus.size]}</td>
                  <td><StatusPill status={bus.status} /></td>
                  <td><div className="table-actions"><button className="icon-button" aria-label="تعديل" onClick={() => openEdit(bus)}>✎</button><button className="icon-button" aria-label="حذف" onClick={() => void remove(bus)}>×</button></div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
      {modalOpen && (
        <Modal title={editing ? "تعديل بيانات الباص" : "إضافة باص جديد"} description="اختر الفئة والحجم ليُنشأ مخطط المقاعد تلقائياً." onClose={() => setModalOpen(false)}>
          {actionError && <ErrorBanner message={actionError} />}
          <form onSubmit={save}>
            <div className="field-grid">
              <label className="field"><span>رقم اللوحة</span><input required value={form.plateNumber} onChange={(event) => setForm({ ...form, plateNumber: event.target.value })} placeholder="مثال: 123456" /></label>
              <label className="field"><span>فئة الباص</span><select value={form.busClass} onChange={(event) => setForm({ ...form, busClass: event.target.value as BusClass })}><option value="REGULAR">عادية</option><option value="FIRST_CLASS">درجة أولى</option><option value="BUSINESS">رجال أعمال</option></select></label>
              <label className="field"><span>الحجم</span><select value={form.size} onChange={(event) => setForm({ ...form, size: event.target.value as BusSize })}><option value="LARGE">كبير · 11 صفاً</option><option value="MEDIUM">متوسط · 9 صفوف</option></select></label>
              <label className="field"><span>الحالة</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as BusStatus })}><option value="ACTIVE">متاح</option><option value="MAINTENANCE">صيانة</option><option value="INACTIVE">متوقف</option></select></label>
            </div>
            <div className="form-actions"><button className="button button-primary" disabled={busy}>{busy ? "جارٍ الحفظ…" : "حفظ البيانات"}</button><button type="button" className="button button-secondary" onClick={() => setModalOpen(false)}>إلغاء</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}

function StatusPill({ status }: { status: BusStatus }) {
  const style = status === "ACTIVE" ? "" : status === "MAINTENANCE" ? "warning" : "neutral";
  return <span className={`status-pill ${style}`}>{busStatusLabels[status]}</span>;
}
