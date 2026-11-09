"use client";

import { useEffect, type ReactNode } from "react";

export function Modal({
  title,
  description,
  onClose,
  children,
  size = "default",
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  size?: "default" | "wide";
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={`modal${size === "wide" ? " modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        dir="rtl"
      >
        <div className="modal-heading">
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button className="icon-button" onClick={onClose} aria-label="إغلاق">×</button>
        </div>
        {children}
      </section>
    </div>
  );
}
