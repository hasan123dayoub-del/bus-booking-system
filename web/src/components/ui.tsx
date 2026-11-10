"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./icon";
import { CLASS_LABEL, longDate, timeFromHHmm, today } from "@/lib/format";
import type { BusClass, TripStatus } from "@/lib/types";

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="date-chip">
        <Icon name="calendar" size={16} />
        <span>{longDate(today())}</span>
      </div>
    </header>
  );
}

export function ClassBadge({ value }: { value: BusClass }) {
  return <span className={`badge class-${value}`}>{CLASS_LABEL[value]}</span>;
}

export type PillTone = "green" | "red" | "amber" | "blue" | "gray";
export function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`toggle${checked ? " on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className = "",
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={`segmented ${className}`} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className={value === o.value ? "active" : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chips<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="chips">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`chip${value === o.value ? " active" : ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Text input with an icon on the start side. */
export function Field({
  label,
  icon,
  children,
  hint,
}: {
  label?: string;
  icon?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      <span className="input-wrap">
        {icon && <Icon name={icon} size={18} className="input-icon" />}
        {children}
      </span>
      {hint && <small className="field-hint">{hint}</small>}
    </label>
  );
}

/** Date picker that shows the date in Arabic ("الجمعة 6 تشرين الثاني") over the native input. */
export function DateInput({
  value,
  onChange,
  format,
  min,
  className = "",
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  format: (v: string) => string;
  min?: string;
  className?: string;
  required?: boolean;
}) {
  return (
    <span className={`input-wrap date-input ${className}`}>
      <Icon name="calendar" size={18} className="input-icon" />
      <span className="date-text">{value ? format(value) : "اختر التاريخ"}</span>
      <input
        type="date"
        value={value}
        min={min}
        required={required}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        onClick={(e) => (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.()}
      />
    </span>
  );
}

/** Time picker that shows "06:00 ص" over the native input. */
export function TimeInput({
  value,
  onChange,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <span className="input-wrap date-input">
      <Icon name="clock" size={18} className="input-icon" />
      <span className="date-text">{value ? timeFromHHmm(value) : "اختر الوقت"}</span>
      <input
        type="time"
        value={value}
        required={required}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        onClick={(e) => (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.()}
      />
    </span>
  );
}

export function CitySelect({
  value,
  onChange,
  icon,
  placeholder,
  options,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  icon: string;
  placeholder: string;
  options: { code: string; name: string }[];
  required?: boolean;
}) {
  return (
    <span className="input-wrap">
      <Icon name={icon} size={18} className="input-icon" />
      <select value={value} required={required} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
    </span>
  );
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal${wide ? " wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="icon-btn soft" onClick={onClose} aria-label="إغلاق">
            <Icon name="x" size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** "⋯" button with a small action menu. */
export function RowMenu({
  items,
}: {
  items: { label: string; icon: string; onClick: () => void; danger?: boolean; hidden?: boolean }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const visible = items.filter((i) => !i.hidden);
  if (!visible.length) return <span className="menu-placeholder" />;
  return (
    <div className="row-menu" ref={ref}>
      <button
        type="button"
        className="icon-btn ghost"
        aria-label="إجراءات"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <Icon name="more" size={18} />
      </button>
      {open && (
        <div className="menu" role="menu">
          {visible.map((i) => (
            <button
              key={i.label}
              type="button"
              role="menuitem"
              className={i.danger ? "danger" : ""}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                i.onClick();
              }}
            >
              <Icon name={i.icon} size={16} />
              {i.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Alert({ tone = "error", children, onClose }: { tone?: "error" | "success"; children: ReactNode; onClose?: () => void }) {
  return (
    <div className={`alert alert-${tone}`} role={tone === "error" ? "alert" : "status"}>
      <Icon name={tone === "error" ? "alert" : "check"} size={18} />
      <span>{children}</span>
      {onClose && (
        <button type="button" className="alert-close" onClick={onClose} aria-label="إغلاق">
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  );
}

export function Empty({ icon = "info", title, text }: { icon?: string; title: string; text?: string }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={22} />
      </span>
      <strong>{title}</strong>
      {text && <p>{text}</p>}
    </div>
  );
}

export function Loading({ label = "جارٍ التحميل…" }: { label?: string }) {
  return (
    <div className="loading">
      <span className="spinner" />
      {label}
    </div>
  );
}

export const TRIP_TONE: Record<TripStatus, PillTone> = {
  SCHEDULED: "green",
  DEPARTED: "blue",
  ARRIVED: "gray",
  CANCELLED: "red",
};
