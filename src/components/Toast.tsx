'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X, ListTodo } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  const visibleToasts = toasts.slice(-1);

  return (
    <div className="pointer-events-none fixed inset-y-0 right-0 z-[2000] flex justify-end pr-2 pt-20 sm:pr-4">
      <div className="flex w-full max-w-[270px] flex-col gap-2">
        {visibleToasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />,
    info: <ListTodo className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />,
  };

  const styles = {
    success: 'border-emerald-500/40 bg-[var(--bg-card)] text-[var(--text-heading)]',
    error: 'border-red-500/40 bg-[var(--bg-card)] text-[var(--text-heading)]',
    info: 'border-[var(--color-primary)]/40 bg-[var(--bg-card)] text-[var(--text-heading)]',
  };

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between gap-2.5 rounded-2xl border px-3.5 py-2.5 text-[11px] shadow-[0_10px_25px_rgba(0,0,0,0.2)] backdrop-blur-md transition-all ${
        styles[toast.type]
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        {icons[toast.type]}
        <span className="truncate font-semibold leading-snug text-[var(--text-heading)]">{toast.message}</span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 rounded-full p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-heading)]"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
