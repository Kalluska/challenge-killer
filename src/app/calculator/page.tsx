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

  const expectancy = (safeWinrate / 100) * safeRr - (1 - safeWinrate / 100) * 1;

  const score = useMemo(() => {
    const raw = 50 + expectancy * 30 - (safeRisk - 1) * 18;
    return clamp(raw, 1, 99);
  }, [expectancy, safeRisk]);

  const lossesToDaily = useMemo(() => {
    if (safeRisk <= 0 || safeDaily <= 0) return 0;
    return Math.ceil(safeDaily / safeRisk);
  }, [safeRisk, safeDaily]);

  const verdict = useMemo(() => {
    if (score < 40) return { label: "LIKELY FAIL", hint: "Your risk profile is statistically brutal." };
    if (score < 70) return { label: "UNSTABLE", hint: "You can pass — but variance can destroy you." };
    return { label: "DECENT", hint: "Still test daily loss + drawdown paths in PRO." };
  }, [score]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-extrabold">Free Pass Estimate</h1>
            <p className="mt-1 text-sm opacity-70">
              Quick risk sanity-check. PRO runs full daily loss + drawdown simulations.
            </p>
          </div>
          <div className="flex gap-3">
            <a href="/" className="text-sm underline opacity-80 hover:opacity-100">Home</a>
            <a href="/login" className="text-sm underline opacity-80 hover:opacity-100">Login</a>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <Card>
            <Input label="Winrate (%)" value={winrate} setValue={setWinrate} />
            <Input label="RR (e.g. 2)" value={rr} setValue={setRr} />
            <Input label="Risk per trade (%)" value={risk} setValue={setRisk} />
            <Input label="Daily loss limit (%)" value={dailyLoss} setValue={setDailyLoss} />
          </Card>

          <Card>
            <div className="text-sm opacity-70">Verdict</div>
            <div className="mt-2 text-4xl font-extrabold">{Math.round(score)}%</div>

            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-extrabold">
                {verdict.label}
              </span>
              <span className="text-sm opacity-70">{verdict.hint}</span>
            </div>

            <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-2 bg-white" style={{ width: `${Math.round(score)}%` }} />
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-sm font-bold">Pain check</div>
              <div className="mt-2 text-sm opacity-80">
                At <b>{safeRisk.toFixed(1)}%</b> risk, about <b>{lossesToDaily}</b> losses can hit your daily loss limit.
              </div>
              <div className="mt-2 text-sm opacity-70">
                PRO shows the *exact* failure paths (daily loss + max drawdown) with thousands of simulations.
              </div>
            </div>

            <div className="mt-5 flex gap-3 flex-wrap">
              <a href="/pro" className="rounded-2xl bg-white px-5 py-3 font-extrabold text-black hover:opacity-90">
                Unlock PRO (19€)
              </a>
              <a
                href="https://challengekiller.gumroad.com/l/mijmrn"
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-white/15 px-5 py-3 font-extrabold hover:bg-white/10"
              >
                Buy on Gumroad
              </a>
            </div>

            <div className="mt-4 text-xs opacity-60">
              Educational tool only. Not financial advice.
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

function Card({ children }: { children: any }) {
  return <div className="rounded-3xl border border-white/10 bg-white/5 p-5">{children}</div>;
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
    <div className="mb-3">
      <label className="block text-sm opacity-70 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return setValue("");
          setValue(Number(raw));
        }}
        className="w-full rounded-2xl border border-white/10 bg-black/40 p-3 outline-none"
      />
    </div>
  );
}
