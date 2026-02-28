"use client";

import { useEffect, useState } from "react";

export default function Toast({
  message,
  show,
  durationMs = 1500,
  onDone,
}: {
  message: string | null;
  show: boolean;
  durationMs?: number;
  onDone?: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show || !message) return;
    setVisible(true);

    const t1 = setTimeout(() => setVisible(false), durationMs);
    const t2 = setTimeout(() => onDone?.(), durationMs + 250);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [show, message, durationMs, onDone]);

  if (!show || !message) return null;

  return (
    <div className="fixed left-1/2 bottom-6 z-[9999] -translate-x-1/2">
      <div
        className={[
          "rounded-2xl border border-white/15 bg-black/80 px-4 py-2 text-sm backdrop-blur-xl shadow-[0_0_40px_rgba(255,255,255,0.08)]",
          "transition-all duration-200",
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        ].join(" ")}
      >
        {message}
      </div>
    </div>
  );
}
