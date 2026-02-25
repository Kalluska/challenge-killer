"use client";

import { useEffect, useMemo, useState } from "react";
import { simulatePassProbability, SimInputs } from "@/lib/montecarlo";
import { buildSurvivalPlan } from "@/lib/survivalPlan";
import { supabase } from "@/lib/supabase";

const LS_KEY = "ck_pro_unlocked_redirect_v2";

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
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [claimMsg, setClaimMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSessionEmail(data.session?.user.email ?? null);
    })();

    // Unlock by redirect: /pro?pro=1 OR existing localStorage
    const saved = typeof window !== "undefined" && localStorage.getItem(LS_KEY) === "1";
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

  const plan = useMemo(() => {
    if (!unlocked) return null;
    return buildSurvivalPlan(i);
  }, [i, unlocked]);

  async function claimProToAccount() {
    setClaimMsg("");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setClaimMsg("Login first, then come back here to claim PRO.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ data: { pro: true } });
    if (error) {
      setClaimMsg(error.message);
      return;
    }
    setClaimMsg("PRO saved to your account ✅");
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-extrabold">Challenge Killer™ PRO</h1>
            <p className="opacity-70 mt-1">
              Daily loss + max drawdown simulations + Survival Plan.
            </p>
          </div>
          <div className="flex gap-3">
            <a href="/calculator" className="text-sm underline opacity-80 hover:opacity-100">Free</a>
            <a href="/" className="text-sm underline opacity-80 hover:opacity-100">Home</a>
            <a href={sessionEmail ? "/account" : "/login"} className="text-sm underline opacity-80 hover:opacity-100">
              {sessionEmail ? "Account" : "Login"}
            </a>
          </div>
        </div>

        {!unlocked ? (
          <div className="mt-10 max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-xl font-extrabold">PRO is locked</div>
            <p className="mt-2 opacity-80">
              Buy PRO on Gumroad. After purchase you’ll be redirected back here automatically.
            </p>

            <a
              className="mt-5 inline-block rounded-2xl bg-white px-6 py-3 font-extrabold text-black hover:opacity-90"
              href="https://challengekiller.gumroad.com/l/mijmrn"
              target="_blank"
              rel="noreferrer"
            >
              Buy PRO (19€) on Gumroad
            </a>

            <div className="mt-4 text-xs opacity-60">
              Redirect after purchase should be: <br />
              <span className="opacity-90">https://challenge-killer.vercel.app/pro?pro=1</span>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-sm opacity-70">PRO status</div>
                  <div className="mt-1 text-lg font-extrabold">
                    Unlocked ✅ {sessionEmail ? `(logged in as ${sessionEmail})` : "(not logged in)"}
                  </div>
                  <div className="text-sm opacity-70 mt-1">
                    If you’re logged in, claim PRO to your account so it stays unlocked across devices.
                  </div>
                </div>
                <button
                  onClick={claimProToAccount}
                  className="rounded-2xl border border-white/15 px-5 py-3 font-extrabold hover:bg-white/10"
                >
                  Claim PRO to Account
                </button>
              </div>
              {claimMsg && <div className="mt-3 text-sm opacity-80">{claimMsg}</div>}
            </div>

            <div className="mt-6 grid md:grid-cols-3 gap-3">
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
              <Card>
                <div className="text-sm opacity-70">Pass Probability (PRO)</div>
                <div className="mt-2 text-5xl font-extrabold">{passPct === null ? "…" : `${passPct}%`}</div>
                <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-2 bg-white" style={{ width: `${passPct ?? 0}%` }} />
                </div>
                <div className="mt-3 text-sm opacity-80">
                  Avg fail day (if you fail):{" "}
                  <span className="font-extrabold">{result ? result.avgFailDay.toFixed(1) : "—"}</span>
                </div>
                <div className="mt-4 text-xs opacity-60">
                  Educational simulation. Not financial advice.
                </div>
              </Card>

              <Card>
                <div className="text-sm opacity-70">Survival Plan (PRO)</div>
                <div className="mt-2 text-xl font-extrabold">
                  Target ≥ {plan?.targetPassPct}% pass odds
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-sm opacity-70">Recommended</div>
                  <div className="mt-2 text-sm">
                    Risk / trade: <b>{plan?.recommendedRiskPerTradePct.toFixed(1)}%</b>
                    <br />
                    Trades / day: <b>{plan?.recommendedTradesPerDay}</b>
                  </div>
                  <div className="mt-2 text-sm opacity-70">
                    Achieved (approx): <b>{plan?.achievedPassPct}%</b>
                  </div>
                </div>

                <ul className="mt-4 text-sm opacity-80 space-y-2 list-disc pl-5">
                  {plan?.notes.map((n, idx) => <li key={idx}>{n}</li>)}
                </ul>
              </Card>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Card({ children }: { children: any }) {
  return <div className="rounded-3xl border border-white/10 bg-white/5 p-5">{children}</div>;
}

function Field(props: { label: string; value: number; onChange: (v: string) => void }) {
  return (
    <label className="grid gap-1">
      <div className="text-sm opacity-70">{props.label}</div>
      <input
        type="number"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-black/40 p-3 outline-none"
      />
    </label>
  );
}
