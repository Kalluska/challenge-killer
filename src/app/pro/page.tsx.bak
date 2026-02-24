"use client";

import { useEffect, useMemo, useState } from "react";
import { simulatePassProbability, SimInputs } from "@/lib/montecarlo";

const LS_KEY = "ck_pro_unlocked_redirect_v1";

const defaults: SimInputs = {
  accountSize: 10000,
  profitTargetPct: 8,
  dailyLossPct: 4,
  maxDdPct: 10,
  riskPerTradePct: 1,
  winRatePct: 45,
  rr: 2,
  tradesPerDay: 3,
  days: 10,
};

function num(v: string) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

export default function ProPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [i, setI] = useState<SimInputs>(defaults);

  useEffect(() => {
    // 1) Already unlocked?
    const saved = localStorage.getItem(LS_KEY) === "1";

    // 2) Just purchased? /pro?pro=1
    const params = new URLSearchParams(window.location.search);
    const viaRedirect = params.get("pro") === "1";

    if (saved || viaRedirect) {
      localStorage.setItem(LS_KEY, "1");
      setUnlocked(true);
    }
  }, []);

  const result = useMemo(() => {
    if (!unlocked) return null;
    return simulatePassProbability(i, 3500);
  }, [i, unlocked]);

  const passPct = result ? Math.round(result.passProb * 100) : null;

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-extrabold">Challenge Killer™ PRO</h1>
            <p className="opacity-70 mt-1">
              Daily loss + max drawdown simulations. See exactly how you blow the rules.
            </p>
          </div>
          <div className="flex gap-3">
            <a href="/calculator" className="text-sm underline opacity-80 hover:opacity-100">Free</a>
            <a href="/" className="text-sm underline opacity-80 hover:opacity-100">Home</a>
          </div>
        </div>

        {!unlocked ? (
          <div className="mt-10 max-w-lg border border-white/15 rounded-2xl p-6 bg-white/5">
            <div className="text-xl font-extrabold mb-2">PRO is locked</div>
            <p className="opacity-80 mb-5">
              Buy PRO on Gumroad, then you’ll be redirected back here automatically.
            </p>

            <a
              className="inline-block bg-white text-black px-5 py-3 rounded-xl font-extrabold"
              href="https://challengekiller.gumroad.com/l/mijmrn"
              target="_blank"
              rel="noreferrer"
            >
              Buy PRO (19€) on Gumroad
            </a>

            <div className="text-xs opacity-60 mt-4">
              After purchase, set Gumroad redirect to: <br />
              <span className="opacity-90">https://YOURDOMAIN/pro?pro=1</span>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-8 grid md:grid-cols-3 gap-3">
              <Field label="Account ($)" value={i.accountSize} onChange={(v) => setI({ ...i, accountSize: num(v) })} />
              <Field label="Target (%)" value={i.profitTargetPct} onChange={(v) => setI({ ...i, profitTargetPct: num(v) })} />
              <Field label="Daily Loss (%)" value={i.dailyLossPct} onChange={(v) => setI({ ...i, dailyLossPct: num(v) })} />
              <Field label="Max DD (%)" value={i.maxDdPct} onChange={(v) => setI({ ...i, maxDdPct: num(v) })} />
              <Field label="Risk / trade (%)" value={i.riskPerTradePct} onChange={(v) => setI({ ...i, riskPerTradePct: num(v) })} />
              <Field label="Winrate (%)" value={i.winRatePct} onChange={(v) => setI({ ...i, winRatePct: num(v) })} />
              <Field label="RR" value={i.rr} onChange={(v) => setI({ ...i, rr: num(v) })} />
              <Field label="Trades/day" value={i.tradesPerDay} onChange={(v) => setI({ ...i, tradesPerDay: num(v) })} />
              <Field label="Days" value={i.days} onChange={(v) => setI({ ...i, days: num(v) })} />
            </div>

            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="border border-white/15 rounded-2xl p-5 bg-white/5">
                <div className="text-sm opacity-70">Pass Probability (PRO)</div>
                <div className="text-5xl font-extrabold mt-2">
                  {passPct === null ? "…" : `${passPct}%`}
                </div>

                <div className="h-2 bg-white/10 rounded-full mt-4">
                  <div className="h-2 bg-white rounded-full" style={{ width: `${passPct ?? 0}%` }} />
                </div>

                <div className="mt-3 text-sm opacity-80">
                  Avg fail day (if you fail):{" "}
                  <span className="font-bold">{result ? result.avgFailDay.toFixed(1) : "—"}</span>
                </div>

                <div className="mt-4 text-xs opacity-60">
                  Educational simulation (approx). Not financial advice.
                </div>
              </div>

              <div className="border border-white/15 rounded-2xl p-5 bg-white/5">
                <div className="font-bold mb-2">How to use this</div>
                <ul className="text-sm opacity-80 space-y-2 list-disc pl-5">
                  <li>Match your prop firm rules exactly.</li>
                  <li>Set your realistic winrate and RR (don’t lie to yourself).</li>
                  <li>Lower risk/trade until pass probability is acceptable.</li>
                  <li>Reduce trades/day to reduce variance.</li>
                </ul>

                <div className="mt-4 text-sm opacity-70">
                  Next upgrade: add a “Survival Plan” generator and PDF export.
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Field(props: { label: string; value: number; onChange: (v: string) => void }) {
  return (
    <label className="grid gap-1">
      <div className="text-sm opacity-70">{props.label}</div>
      <input
        type="number"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/15 rounded-xl p-3 outline-none"
      />
    </label>
  );
}
