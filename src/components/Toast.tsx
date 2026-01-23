"use client";

import { useState, useEffect } from "react";

interface Toast {
  id: string;
  title: string;
  body: string;
  type: "success" | "info" | "warning" | "error";
}

let toastId = 0;
const toastListeners: Set<(toast: Toast) => void> = new Set();

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 5000);
    };

    toastListeners.add(listener);

    return () => {
      toastListeners.delete(listener);
    };
  }, []);

  return toasts;
}

export function showToast(title: string, body: string, type: "success" | "info" | "warning" | "error" = "info") {
  const toast: Toast = {
    id: `toast-${toastId++}`,
    title,
    body,
    type,
  };

  toastListeners.forEach((listener) => listener(toast));
}

export function ToastContainer() {
  const toasts = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto
            rounded-lg p-4 shadow-lg
            max-w-sm
            animate-slide-in
            ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : toast.type === "error"
                  ? "bg-red-500 text-white"
                  : toast.type === "warning"
                    ? "bg-yellow-500 text-white"
                    : "bg-blue-500 text-white"
            }
          `}
        >
          <div className="font-semibold">{toast.title}</div>
          <div className="text-sm opacity-90">{toast.body}</div>
        </div>
      ))}
    </div>
  );
}
