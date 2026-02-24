"use client";

import { useMemo, useState } from "react";

export default function Calculator() {
  const [winrate, setWinrate] = useState<number | "">(45);
  const [rr, setRr] = useState<number | "">(2);
  const [risk, setRisk] = useState<number | "">(1);

  const safeWinrate = typeof winrate === "number" ? winrate : 0;
  const safeRr = typeof rr === "number" ? rr : 0;
  const safeRisk = typeof risk === "number" ? risk : 0;

  const expectancy = (safeWinrate / 100) * safeRr - (1 - safeWinrate / 100) * 1;

  const score = useMemo(() => {
    const raw = 50 + expectancy * 30 - (safeRisk - 1) * 15;
    return Math.max(1, Math.min(99, raw));
  }, [expectancy, safeRisk]);

  const message =
    score < 45
      ? "High risk of failing your challenge. PRO shows daily loss + max drawdown paths."
      : score < 70
      ? "You might pass, but PRO shows exactly where you can still blow it."
      : "Good odds — PRO will stress test your rules with simulations.";

  return (
    <main className="min-h-screen bg-black text-white flex justify-center p-6">
      <div className="max-w-xl w-full">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-3xl font-extrabold mb-6">Free Pass Estimate</h1>
          <a href="/" className="text-sm underline opacity-80 hover:opacity-100">Home</a>
        </div>

        <div className="space-y-4">
          <Input label="Winrate (%)" value={winrate} setValue={setWinrate} />
          <Input label="RR (e.g. 2)" value={rr} setValue={setRr} />
          <Input label="Risk per trade (%)" value={risk} setValue={setRisk} />
        </div>

        <div className="mt-8 p-6 border border-white/15 rounded-2xl bg-white/5">
          <p className="text-sm opacity-70 mb-2">Estimated Survival Score</p>
          <div className="text-5xl font-extrabold mb-3">{Math.round(score)}%</div>
          <p className="text-sm opacity-80 mb-5">{message}</p>

          <div className="h-2 bg-white/10 rounded-full">
            <div className="h-2 bg-white rounded-full" style={{ width: `${Math.round(score)}%` }} />
          </div>

          <div className="mt-6 flex gap-3 flex-wrap">
            <a
              href="/pro"
              className="bg-white text-black px-4 py-2 rounded-xl font-extrabold"
            >
              Unlock PRO (19€)
            </a>

            <a
              href="https://challengekiller.gumroad.com/l/mijmrn"
              target="_blank"
              rel="noreferrer"
              className="border border-white/20 px-4 py-2 rounded-xl font-extrabold hover:bg-white/10 transition"
            >
              Buy on Gumroad
            </a>
          </div>

          <p className="text-xs opacity-60 mt-4">
            Tip: Replace the Gumroad link (YOUR_PERMALINK) with your product URL.
          </p>
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
    <div>
      <label className="block text-sm opacity-70 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            setValue("");
            return;
          }
          setValue(Number(raw));
        }}
        className="w-full bg-white/10 border border-white/20 rounded-xl p-3 outline-none"
      />
    </div>
  );
}
