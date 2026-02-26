"use client";

import { useEffect, useMemo, useState } from "react";

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function SocialProof() {
  const [runsToday, setRunsToday] = useState<number>(0);

  useEffect(() => {
    const k = `ck_runs_${todayKey()}`;
    const v = Number(localStorage.getItem(k) || "0");
    setRunsToday(v);
  }, []);

  const buildTag = useMemo(() => {
    // Vercel injects this at runtime in many setups; fallback to "recent"
    const t = (process.env.NEXT_PUBLIC_BUILD_TAG || "").trim();
    return t || "recent";
  }, []);

  return (
    <section className="mx-auto mt-20 max-w-5xl px-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm opacity-70">Trusted by rule-based traders</div>
            <div className="mt-2 text-2xl font-extrabold">
              Designed for prop-firm rules, not “signals”.
            </div>
            <div className="mt-2 text-sm opacity-75">
              Reality-check your settings, then stress-test them in PRO.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
              <div className="text-xs opacity-60">Your runs today</div>
              <div className="text-xl font-extrabold">{runsToday}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
              <div className="text-xs opacity-60">Model</div>
              <div className="text-xl font-extrabold">Monte Carlo</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 col-span-2 md:col-span-1">
              <div className="text-xs opacity-60">Build</div>
              <div className="text-xl font-extrabold">{buildTag}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs opacity-80">
            Daily loss / max drawdown aware
          </span>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs opacity-80">
            Evaluation survival probability
          </span>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs opacity-80">
            Variance & losing streak risk
          </span>
        </div>

        <div className="mt-6 text-xs opacity-60">
          Tip: runs today increments when you run simulations/calculations on this device (privacy-friendly).
        </div>
      </div>
    </section>
  );
}
