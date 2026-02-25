"use client";

import { useMemo, useState } from "react";

function clamp(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, x));
}

export default function Calculator() {
  const [winrate, setWinrate] = useState<number | "">(45);
  const [rr, setRr] = useState<number | "">(2);
  const [risk, setRisk] = useState<number | "">(1);
  const [dailyLoss, setDailyLoss] = useState<number | "">(4);

  const safeWinrate = typeof winrate === "number" ? winrate : 0;
  const safeRr = typeof rr === "number" ? rr : 0;
  const safeRisk = typeof risk === "number" ? risk : 0.1;
  const safeDaily = typeof dailyLoss === "number" ? dailyLoss : 0;

  const expectancy = (safeWinrate / 100) * safeRr - (1 - safeWinrate / 100);

  const score = useMemo(() => {
    const raw = 50 + expectancy * 35 - (safeRisk - 1) * 22;
    return clamp(raw, 1, 99);
  }, [expectancy, safeRisk]);

  const lossesToDaily = useMemo(() => {
    if (safeRisk <= 0 || safeDaily <= 0) return 0;
    return Math.ceil(safeDaily / safeRisk);
  }, [safeRisk, safeDaily]);

  const expectedLosingStreak = useMemo(() => {
    if (safeWinrate <= 0) return 0;
    return Math.round(Math.log(0.05) / Math.log(1 - safeWinrate / 100));
  }, [safeWinrate]);

  const verdictColor =
    score < 40 ? "text-red-500" :
    score < 70 ? "text-yellow-400" :
    "text-green-400";

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-neutral-950 to-black text-white p-6">
      <div className="mx-auto max-w-4xl">

        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              Free Pass Estimate
            </h1>
            <p className="mt-2 text-sm opacity-70">
              Quick risk reality-check. PRO runs full Monte Carlo simulations.
            </p>
          </div>
          <a href="/" className="text-sm underline opacity-70 hover:opacity-100">
            Home
          </a>
        </div>

        <div className="mt-10 grid md:grid-cols-2 gap-8">

          {/* INPUT CARD */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <Input label="Winrate (%)" value={winrate} setValue={setWinrate} />
            <Input label="RR (e.g. 2)" value={rr} setValue={setRr} />
            <Input label="Risk per trade (%)" value={risk} setValue={setRisk} />
            <Input label="Daily loss limit (%)" value={dailyLoss} setValue={setDailyLoss} />
          </div>

          {/* RESULT CARD */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">

            <div className="text-sm opacity-70">Estimated Survival Probability</div>
            <div className={`mt-2 text-5xl font-extrabold ${verdictColor}`}>
              {Math.round(score)}%
            </div>

            {/* Animated Progress */}
            <div className="mt-4 h-3 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-3 bg-white transition-all duration-700 ease-out"
                style={{ width: `${Math.round(score)}%` }}
              />
            </div>

            {/* KPI BOXES */}
            <div className="mt-6 grid gap-4">

              <AlertBox
                title="Losses to Daily Kill"
                value={lossesToDaily}
                desc={`~${lossesToDaily} consecutive losses can hit your daily limit.`}
              />

              <AlertBox
                title="Expected Losing Streak"
                value={expectedLosingStreak}
                desc="Statistically probable worst streak."
              />

              <AlertBox
                title="Blow-up Window"
                value="Day 1–5"
                desc="Most evaluation failures occur early due to variance."
              />

            </div>

            <div className="mt-8 flex gap-4 flex-wrap">
              <a
                href="/pro"
                className="relative rounded-2xl bg-white px-6 py-3 font-extrabold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
              >
                Unlock PRO (19€)
              </a>

              <a
                href="https://challengekiller.gumroad.com/l/mijmrn"
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-white/20 px-6 py-3 font-extrabold transition-all duration-300 hover:bg-white/10"
              >
                Buy on Gumroad
              </a>
            </div>

            <div className="mt-4 text-xs opacity-50">
              Educational tool only. Not financial advice.
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  setValue,
}: {
  label: string;
  value: number | "";
  setValue: (v: number | "") => void;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm opacity-70 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return setValue("");
          setValue(Number(raw));
        }}
        className="w-full rounded-2xl border border-white/10 bg-black/40 p-3 outline-none focus:ring-2 focus:ring-white/30 transition-all"
      />
    </div>
  );
}

function AlertBox({
  title,
  value,
  desc,
}: {
  title: string;
  value: any;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="text-xs uppercase tracking-wide opacity-60">{title}</div>
      <div className="mt-1 text-2xl font-extrabold text-red-500">{value}</div>
      <div className="mt-1 text-xs opacity-70">{desc}</div>
    </div>
  );
}
