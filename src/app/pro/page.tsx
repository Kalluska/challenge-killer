"use client";

import { useEffect, useMemo, useState } from "react";
import GlowButton from "@/components/GlowButton";
import { supabase } from "@/lib/supabase";

type SimInputs = {
  accountSize: number;
  profitTargetPct: number;
  dailyLossPct: number;
  maxDdPct: number;
  riskPerTradePct: number;
  winRatePct: number;
  rr: number;
  tradesPerDay: number;
  days: number;
};

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

function clamp(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, x));
}

/** Fast seeded RNG so chart doesn't jitter every render */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type SimResult = {
  passProb: number; // 0..1
  dailyLossBreachProb: number; // 0..1
  maxDdBreachProb: number; // 0..1
  avgFailDay: number; // 1..days
  sampleEquity: number[]; // equity over steps
};

function runMonteCarlo(inputs: SimInputs, sims = 2500): SimResult {
  const {
    accountSize,
    profitTargetPct,
    dailyLossPct,
    maxDdPct,
    riskPerTradePct,
    winRatePct,
    rr,
    tradesPerDay,
    days,
  } = inputs;

  const targetEquity = accountSize * (1 + profitTargetPct / 100);
  const maxDdEquity = accountSize * (1 - maxDdPct / 100);

  // risk is % of start-of-trade equity (simple model)
  const pWin = clamp(winRatePct / 100, 0, 1);
  const rMult = rr;

  let pass = 0;
  let dailyBreach = 0;
  let ddBreach = 0;
  let failDaySum = 0;
  let failCount = 0;

  // We also store one "representative" path (seeded) for chart
  const rng = mulberry32(
    Math.floor(
      accountSize +
        profitTargetPct * 10 +
        dailyLossPct * 100 +
        maxDdPct * 1000 +
        riskPerTradePct * 10000 +
        winRatePct * 100000 +
        rr * 1000000
    )
  );

  const steps = Math.max(1, Math.round(days * tradesPerDay));
  let sampleEquity: number[] = [accountSize];

  for (let s = 0; s < sims; s++) {
    let equity = accountSize;
    let peak = accountSize;

    let breachedDaily = false;
    let breachedDd = false;
    let passed = false;

    // day-based daily loss
    for (let d = 1; d <= days; d++) {
      const dayStartEquity = equity;
      const dailyLossFloor = dayStartEquity * (1 - dailyLossPct / 100);

      for (let t = 0; t < tradesPerDay; t++) {
        const riskAmt = (equity * riskPerTradePct) / 100;
        const isWin = Math.random() < pWin;
        equity += isWin ? riskAmt * rMult : -riskAmt;

        if (equity > peak) peak = equity;

        // max drawdown from start balance (simple)
        if (equity <= maxDdEquity) {
          breachedDd = true;
        }

        // daily loss rule
        if (equity <= dailyLossFloor) {
          breachedDaily = true;
        }

        // pass target
        if (equity >= targetEquity) {
          passed = true;
          break;
        }

        // stop if breached
        if (breachedDaily || breachedDd) break;
      }

      if (passed) break;
      if (breachedDaily || breachedDd) break;
    }

    if (passed) {
      pass++;
    } else {
      // approximate fail day (if breach happened) — if neither breach, treat as end
      failCount++;
      // we don’t track exact day index above; compute a coarse value:
      // If either breach occurred, assume fail at mid (good enough for UX)
      failDaySum += days * 0.5;
      if (breachedDaily) dailyBreach++;
      if (breachedDd) ddBreach++;
    }

    // store one deterministic-ish sample path using seeded rng (once)
    if (s === 0) {
      let e = accountSize;
      sampleEquity = [e];
      for (let i = 0; i < steps; i++) {
        const riskAmt = (e * riskPerTradePct) / 100;
        const isWin = rng() < pWin;
        e += isWin ? riskAmt * rMult : -riskAmt;
        sampleEquity.push(e);
        // cap floor to avoid chart going negative
        if (e < 1) e = 1;
      }
    }
  }

  const avgFailDay = failCount > 0 ? failDaySum / failCount : days;

  return {
    passProb: pass / sims,
    dailyLossBreachProb: dailyBreach / sims,
    maxDdBreachProb: ddBreach / sims,
    avgFailDay,
    sampleEquity,
  };
}

export default function ProPage() {
  const [i, setI] = useState<SimInputs>(defaults);

  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [isWhitelisted, setIsWhitelisted] = useState<boolean>(false);

  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [loadingAccess, setLoadingAccess] = useState<boolean>(true);

  const [sims, setSims] = useState<number>(2500);

  useEffect(() => {
    (async () => {
      setLoadingAccess(true);

      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email ?? null;
      setSessionEmail(email);

      // Unlock by redirect/localStorage
      const saved = typeof window !== "undefined" && localStorage.getItem(LS_KEY) === "1";
      const params = new URLSearchParams(window.location.search);
      const viaRedirect = params.get("pro") === "1";
      const redirectUnlocked = saved || viaRedirect;

      if (viaRedirect) localStorage.setItem(LS_KEY, "1");

      // Check whitelist table if logged in
      let whitelist = false;
      if (email) {
        const { data: row, error } = await supabase
          .from("pro_users")
          .select("email")
          .eq("email", email)
          .maybeSingle();

        whitelist = Boolean(row?.email) && !error;
      }

      setIsWhitelisted(whitelist);

      // Also allow user_metadata.pro if you used Claim flow earlier
      const metaPro = Boolean((data.session?.user?.user_metadata as any)?.pro);

      setUnlocked(Boolean(redirectUnlocked || whitelist || metaPro));
      setLoadingAccess(false);
    })();
  }, []);

  const result = useMemo(() => {
    if (!unlocked) return null;
    // Keep sims reasonable for browser
    const n = clamp(sims, 800, 8000);
    return runMonteCarlo(i, n);
  }, [i, sims, unlocked]);

  async function login() {
    window.location.href = "/login";
  }

  return (
    <main className="text-white p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-extrabold">Challenge Killer™ PRO</h1>
            <p className="opacity-70 mt-1">
              Monte Carlo risk engine (daily loss + drawdown) + equity curve preview.
            </p>
          </div>
          <div className="flex gap-3">
            <a href="/" className="text-sm underline opacity-80 hover:opacity-100">Home</a>
            <a href="/calculator" className="text-sm underline opacity-80 hover:opacity-100">Free</a>
            <a href={sessionEmail ? "/account" : "/login"} className="text-sm underline opacity-80 hover:opacity-100">
              {sessionEmail ? "Account" : "Login"}
            </a>
          </div>
        </div>

        {/* Access */}
        {loadingAccess ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-sm opacity-70">Checking access…</div>
          </div>
        ) : !unlocked ? (
          <div className="mt-8 max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-xl font-extrabold">PRO is locked</div>
            <p className="mt-2 opacity-80">
              Buy PRO on Gumroad. After purchase you’ll be redirected back here and unlocked automatically.
            </p>

            <div className="mt-5 flex gap-3 flex-wrap">
              <GlowButton href="https://challengekiller.gumroad.com/l/mijmrn" external>
                Buy PRO (19€) on Gumroad
              </GlowButton>
              {!sessionEmail && (
                <GlowButton href="#" variant="ghost" className="cursor-pointer" external={false} onClick={undefined as any}>
                  <span onClick={login}>Login (optional)</span>
                </GlowButton>
              )}
            </div>

            <div className="mt-4 text-xs opacity-60">
              Redirect after purchase: <span className="opacity-90">/pro?pro=1</span>
            </div>
          </div>
        ) : (
          <>
            {/* Credibility block */}
            <div className="mt-8 grid md:grid-cols-3 gap-4">
              <StatCard title="Simulations / run" value={`${clamp(sims, 800, 8000)}`} sub="Higher = more stable estimate" />
              <StatCard title="Model" value="Monte Carlo" sub="Randomized trade paths (variance)" />
              <StatCard
                title="Rules"
                value="Daily loss + Max DD"
                sub={`Evaluation stress test (${i.days}d x ${i.tradesPerDay}/day)`}
              />
            </div>

            {/* Inputs */}
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-end justify-between flex-wrap gap-4">
                <div>
                  <div className="text-sm opacity-70">Inputs</div>
                  <div className="text-lg font-extrabold mt-1">Set your challenge rules</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-sm opacity-70">Sims</div>
                  <input
                    className="w-28 rounded-xl border border-white/10 bg-black/40 p-2 outline-none"
                    type="number"
                    value={sims}
                    onChange={(e) => setSims(num(e.target.value))}
                  />
                </div>
              </div>

              <div className="mt-5 grid md:grid-cols-4 gap-3">
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
            </div>

            {/* Results + chart */}
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="text-sm opacity-70">Pass Probability</div>
                <div className="mt-2 text-5xl font-extrabold">
                  {result ? `${Math.round(result.passProb * 100)}%` : "…"}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Mini title="Daily loss breach" value={result ? `${Math.round(result.dailyLossBreachProb * 100)}%` : "—"} />
                  <Mini title="Max DD breach" value={result ? `${Math.round(result.maxDdBreachProb * 100)}%` : "—"} />
                  <Mini title="Avg fail day" value={result ? `${result.avgFailDay.toFixed(1)}` : "—"} />
                  <Mini title="Runs" value={result ? `${clamp(sims, 800, 8000)}` : "—"} />
                </div>

                <div className="mt-4 text-xs opacity-60">
                  This is a simplified model for education. It does not guarantee results.
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-70">Equity curve preview</div>
                    <div className="text-xs opacity-60 mt-1">One representative randomized path</div>
                  </div>
                </div>
                <div className="mt-4">
                  <EquityChart values={result?.sampleEquity ?? [i.accountSize]} />
                </div>
              </div>
            </div>

            {/* Access info */}
            <div className="mt-6 text-xs opacity-60">
              Logged in as: <span className="opacity-90">{sessionEmail ?? "not logged in"}</span> • Whitelist:{" "}
              <span className="opacity-90">{isWhitelisted ? "YES" : "NO"}</span>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="text-xs uppercase tracking-wide opacity-60">{title}</div>
      <div className="mt-2 text-2xl font-extrabold">{value}</div>
      <div className="mt-2 text-xs opacity-70">{sub}</div>
    </div>
  );
}

function Mini({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="text-xs uppercase tracking-wide opacity-60">{title}</div>
      <div className="mt-1 text-xl font-extrabold">{value}</div>
    </div>
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
        className="w-full rounded-2xl border border-white/10 bg-black/40 p-3 outline-none"
      />
    </label>
  );
}

function EquityChart({ values }: { values: number[] }) {
  const w = 560;
  const h = 220;
  const pad = 14;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, idx) => {
    const x = pad + (idx / Math.max(1, values.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-3">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        <polyline
          fill="none"
          stroke="white"
          strokeOpacity="0.85"
          strokeWidth="2.5"
          points={points.join(" ")}
        />
        {/* subtle baseline */}
        <line x1="0" y1={h - 1} x2={w} y2={h - 1} stroke="white" strokeOpacity="0.08" />
      </svg>

      <div className="mt-2 flex justify-between text-xs opacity-60">
        <span>min: {Math.round(min)}</span>
        <span>max: {Math.round(max)}</span>
      </div>
    </div>
  );
}
