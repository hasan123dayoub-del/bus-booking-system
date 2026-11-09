"use client";

import { useState } from "react";

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="feedback error-feedback" role="alert">
      <span className="feedback-icon">!</span>
      <span>{message}</span>
      {onRetry && (
        <button className="text-button" onClick={onRetry}>إعادة المحاولة</button>
      )}
    </div>
  );
}

export function SuccessBanner({ message }: { message: string }) {
  return <div className="feedback success-feedback" role="status">{message}</div>;
}

export function LoadingState({ label = "جارٍ تحميل البيانات…" }: { label?: string }) {
  return (
    <div className="loading-state" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="empty-state">
      <span aria-hidden="true">◇</span>
      <strong>{title}</strong>
      {description && <p>{description}</p>}
    </div>
  );
}

export function useActionState() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  return {
    error,
    success,
    busy,
    setError,
    setSuccess,
    setBusy,
    clear: () => {
      setError("");
      setSuccess("");
    },
  };
}
