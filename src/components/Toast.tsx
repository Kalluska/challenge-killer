"use client";
import { useEffect } from "react";

export default function Toast({
  open,
  message,
  durationMs = 1600,
  onClose,
}: {
  open: boolean;
  message: string | null;
  durationMs?: number;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose(), durationMs);
    return () => clearTimeout(t);
  }, [open, durationMs, onClose]);

  if (!open || !message) return null;

  return (
    <div className="fixed left-1/2 bottom-6 z-[9999] -translate-x-1/2">
      <div className="rounded-2xl border border-white/15 bg-black/80 px-5 py-3 text-sm backdrop-blur-xl shadow-[0_0_40px_rgba(255,255,255,0.08)]">
        {message}
      </div>
    </div>
  );
}
