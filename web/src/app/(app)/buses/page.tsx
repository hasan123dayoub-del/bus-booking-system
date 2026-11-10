"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Icon } from "@/components/icon";
import { SeatMap } from "@/components/seat-map";
import { Alert, Chips, ClassBadge, Empty, Field, Loading, PageHeader, Pill, Segmented, Toggle } from "@/components/ui";
import { api, errorMessage, qs } from "@/lib/api";
import { BUS_STATUS_LABEL, CLASS_LABEL, CLASS_LAYOUT, SIZE_LABEL, number } from "@/lib/format";
import { seatTotal } from "@/lib/seat-map";
import type { Bus, BusClass, BusSize, BusStatus } from "@/lib/types";

type Filter = "ALL" | BusStatus;
interface Form {
  plateNumber: string;
  busClass: BusClass;
  size: BusSize;
  status: BusStatus;
}
const EMPTY: Form = { plateNumber: "", busClass: "REGULAR", size: "LARGE", status: "ACTIVE" };

export default function BusesPage() {
  const [buses, setBuses] = useState<Bus[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [editing, setEditing] = useState<Bus | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    try {
      setBuses(await api.get<Bus[]>(`/admin/buses${qs({ q, status: filter === "ALL" ? "" : filter })}`));
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [q, filter]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  function edit(bus: Bus) {
    setEditing(bus);
    setForm({ plateNumber: bus.plateNumber, busClass: bus.busClass, size: bus.size, status: bus.status });
    setError("");
  }

  function reset() {
    setEditing(null);
    setForm(EMPTY);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const body = { ...form, plateNumber: form.plateNumber.trim() };
      if (editing) {
        await api.patch(`/admin/buses/${editing._id}`, body);
        setSuccess(`حُفظت تعديلات الباص ${body.plateNumber}.`);
      } else {
        await api.post("/admin/buses", body);
        setSuccess(`أُضيف الباص ${body.plateNumber}.`);
      }
      reset();
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!editing || !window.confirm(`حذف الباص ${editing.plateNumber}؟`)) return;
    setBusy(true);
    try {
      await api.delete(`/admin/buses/${editing._id}`);
      setSuccess(`حُذف الباص ${editing.plateNumber}.`);
      reset();
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="الباصات" subtitle="الدرجة والحجم يحددان مخطط المقاعد تلقائيًا" />

      <div className="card filter-bar">
        <span className="input-wrap search">
          <Icon name="search" size={18} className="input-icon" />
          <input placeholder="ابحث برقم اللوحة" value={q} onChange={(e) => setQ(e.target.value)} />
        </span>
        <Chips
          value={filter}
          onChange={setFilter}
          options={[
            { value: "ALL", label: "الكل" },
            { value: "ACTIVE", label: "فعّال" },
            { value: "MAINTENANCE", label: "صيانة" },
          ]}
        />
      </div>

      {success && <Alert tone="success" onClose={() => setSuccess("")}>{success}</Alert>}

      <div className="split">
        <section className="card table-card">
          {!buses ? (
            <Loading />
          ) : !buses.length ? (
            <Empty icon="bus" title="لا توجد باصات" text="أضف باصًا من النموذج المجاور." />
          ) : (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>رقم اللوحة</th>
                    <th>الدرجة</th>
                    <th>الحجم</th>
                    <th>المقاعد</th>
                    <th>الحالة</th>
                    <th aria-label="تعديل" />
                  </tr>
                </thead>
                <tbody>
                  {buses.map((b) => (
                    <tr key={b._id} className={editing?._id === b._id ? "selected" : ""} onClick={() => edit(b)}>
                      <td className="strong plate">{b.plateNumber}</td>
                      <td><ClassBadge value={b.busClass} /></td>
                      <td>{SIZE_LABEL[b.size]}</td>
                      <td className="num-green">{number(b.seatCount)}</td>
                      <td><Pill tone={b.status === "ACTIVE" ? "green" : "amber"}>{BUS_STATUS_LABEL[b.status]}</Pill></td>
                      <td className="actions">
                        <button type="button" className="icon-btn ghost green" aria-label={`تعديل ${b.plateNumber}`} onClick={(e) => { e.stopPropagation(); edit(b); }}>
                          <Icon name="edit" size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <form className="card panel side-form" onSubmit={save}>
          <div className="panel-head">
            <div>
              <h2>{editing ? `تعديل الباص ${editing.plateNumber}` : "إضافة باص"}</h2>
              <p className="muted small">يتغيّر المخطط فورًا عند تغيير الدرجة أو الحجم</p>
            </div>
            {editing && (
              <button type="button" className="icon-btn soft" onClick={reset} aria-label="إغلاق التعديل">
                <Icon name="x" size={16} />
              </button>
            )}
          </div>

          {error && <Alert onClose={() => setError("")}>{error}</Alert>}

          <Field label="رقم اللوحة" icon="bus">
            <input required maxLength={20} placeholder="مثال: أ-214" value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} />
          </Field>

          <div className="field">
            <span className="field-label">الدرجة</span>
            <Segmented
              value={form.busClass}
              onChange={(busClass) => setForm({ ...form, busClass })}
              options={(Object.keys(CLASS_LABEL) as BusClass[]).map((c) => ({ value: c, label: CLASS_LABEL[c] }))}
            />
          </div>

          <div className="size-status">
            <div className="field">
              <span className="field-label">الحجم</span>
              <Segmented
                value={form.size}
                onChange={(size) => setForm({ ...form, size })}
                options={[
                  { value: "LARGE", label: "كبير" },
                  { value: "MEDIUM", label: "متوسط" },
                ]}
              />
            </div>
            <div className="field status-field">
              <span className="field-label">الحالة</span>
              <span className="toggle-row">
                <Toggle
                  checked={form.status === "ACTIVE"}
                  label="الباص فعّال"
                  onChange={(on) => setForm({ ...form, status: on ? "ACTIVE" : "MAINTENANCE" })}
                />
                <b>{BUS_STATUS_LABEL[form.status]}</b>
              </span>
            </div>
          </div>

          <div className="preview">
            <SeatMap busClass={form.busClass} size={form.size} small />
            <span className="muted small">
              معاينة المخطط · {CLASS_LABEL[form.busClass]} <bdi dir="ltr">{CLASS_LAYOUT[form.busClass]}</bdi> · {SIZE_LABEL[form.size]} · {number(seatTotal(form.busClass, form.size))} مقعدًا
            </span>
          </div>

          <div className="form-actions">
            <button className="btn btn-primary btn-grow" disabled={busy}>
              <Icon name="check" size={18} />
              {editing ? "حفظ التعديلات" : "إضافة الباص"}
            </button>
            {editing ? (
              <>
                <button type="button" className="btn btn-outline" onClick={reset}>إلغاء</button>
                <button type="button" className="icon-btn danger" onClick={() => void remove()} aria-label="حذف الباص" title="حذف الباص">
                  <Icon name="trash" size={18} />
                </button>
              </>
            ) : null}
          </div>
        </form>
      </div>
    </>
  );
}
