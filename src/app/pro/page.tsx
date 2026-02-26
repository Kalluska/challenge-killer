"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import GlowButton from "@/components/GlowButton";
import { supabase } from "@/lib/supabase";

const LS_KEY = "ck_pro_unlocked_redirect_v2";

type InputsStr = {
  accountSize: string;
  profitTargetPct: string;
  dailyLossPct: string;
  maxDdPct: string;
  riskPerTradePct: string;
  winRatePct: string;
  rr: string;
  tradesPerDay: string;
  days: string;
};

const defaults: InputsStr = {
  accountSize: "10000",
  profitTargetPct: "8",
  dailyLossPct: "4",
  maxDdPct: "10",
  riskPerTradePct: "1",
  winRatePct: "45",
  rr: "2",
  tradesPerDay: "3",
  days: "10",
};

function clamp(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, x));
}

function cleanNumberInput(raw: string) {
  // Keep digits + dot, remove everything else
  let s = raw.replace(/[^0-9.]/g, "");
  // Only one dot
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
  }
  // Allow empty while typing
  if (s === "") return "";

  // Strip leading zeros like 052 -> 52, but keep "0" and "0.x"
  const parts = s.split(".");
  let intPart = parts[0] ?? "";
  const decPart = parts[1];

  // if user typed "." first, normalize to "0."
  if (intPart === "" && decPart !== undefined) intPart = "0";

  // strip leading zeros only if there is another digit after them
  intPart = intPart.replace(/^0+(?=\d)/, "");
  if (intPart === "") intPart = "0";

  return decPart !== undefined ? `${intPart}.${decPart}` : intPart;
}

function toNum(s: string, fallback: number) {
  const x = Number(s);
  return Number.isFinite(x) ? x : fallback;
}

/** Seeded RNG for stable sample chart */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (
(t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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

type SimResult = {
  passProb: number;
  dailyLossBreachProb: number;
  maxDdBreachProb: number;
  avgFailDay: number;
  sampleEquity: number[];
  failByDay: number[]; // length = days, counts of failures per day
  failCauseCounts: { daily: number; dd: number };
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

  const pWin = clamp(winRatePct / 100, 0, 1);

  let pass = 0;
  let dailyBreachRuns = 0;
  let ddBreachRuns = 0;

  let failDaySum = 0;
  let failCount = 0;

    const failCauseCounts = { daily: 0, dd: 0 };

  // Build arrays
  const failByDayArr = Array(days).fill(0) as number[];

  // Seeded RNG for stable sample chart
  const seed = Math.floor(
    accountSize +
      winRatePct * 1000 +
      rr * 5000 +
      profitTargetPct * 10 +
      dailyLossPct * 100 +
      maxDdPct * 1000 +
      riskPerTradePct * 10000 +
      tradesPerDay * 7 +
      days * 13
  );
  const rng = mulberry32(seed);

  const steps = Math.max(1, Math.round(days * tradesPerDay));
  let sampleEquity: number[] = [accountSize];

  for (let s = 0; s < sims; s++) {
    let equity = accountSize;
    let passed = false;

    let breachedDaily = false;
    let breachedDd = false;

    let failDay = days;

    for (let d = 1; d <= days; d++) {
      const dayStartEquity = equity;
      const dailyLossFloor = dayStartEquity * (1 - dailyLossPct / 100);

      for (let t = 0; t < tradesPerDay; t++) {
        const riskAmt = (equity * riskPerTradePct) / 100;
        const isWin = Math.random() < pWin;
        equity += isWin ? riskAmt * rr : -riskAmt;

        if (equity <= maxDdEquity) breachedDd = true;
        if (equity <= dailyLossFloor) breachedDaily = true;

        if (equity >= targetEquity) {
          passed = true;
          break;
        }

        if (breachedDaily || breachedDd) break;
      }

      if (passed) break;

      if (breachedDaily || breachedDd) {
        failDay = d;
        failByDayArr[d - 1]++;

        if (breachedDaily) {
          dailyBreachRuns++;
          failCauseCounts.daily++;
        }
        if (breachedDd) {
          ddBreachRuns++;
          failCauseCounts.dd++;
        }

        failCount++;
        failDaySum += d;
        break;
      }
    }

    if (passed) pass++;

    // Stable sample path for chart (seeded)
    if (s === 0) {
      let e = accountSize;
      sampleEquity = [e];
      for (let k = 0; k < steps; k++) {
        const riskAmt = (e * riskPerTradePct) / 100;
        const isWin = rng() < pWin;
        e += isWin ? riskAmt * rr : -riskAmt;
        if (e < 1) e = 1;
        sampleEquity.push(e);
      }
    }
  }

  const avgFailDay = failCount > 0 ? failDaySum / failCount : days;

  return {
    passProb: pass / sims,
    dailyLossBreachProb: dailyBreachRuns / sims,
    maxDdBreachProb: ddBreachRuns / sims,
    avgFailDay,
    sampleEquity,
    failByDay: failByDayArr,
    failCauseCounts,
  };
}

export default function ProPage() {
  const sp = useSearchParams();
  const [claimedBanner, setClaimedBanner] = useState(false);

  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [isWhitelisted, setIsWhitelisted] = useState<boolean>(false);
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [loadingAccess, setLoadingAccess] = useState<boolean>(true);

  const [sims, setSims] = useState<string>("2500");
  const [inp, setInp] = useState<InputsStr>(defaults);

  useEffect(() => {
    // Show "PRO Activated" banner if user came from /claim
    try {
      if (sp.get("claimed") === "1") {
        setClaimedBanner(true);
        // auto-hide
        setTimeout(() => setClaimedBanner(false), 4500);
      }
    } catch {}

    (async () => {
      setLoadingAccess(true);

      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email ?? null;
      setSessionEmail(email);

      const saved = typeof window !== "undefined" && localStorage.getItem(LS_KEY) === "1";
      const params = new URLSearchParams(window.location.search);
      const viaRedirect = params.get("pro") === "1";
      const redirectUnlocked = saved || viaRedirect;
      if (viaRedirect) localStorage.setItem(LS_KEY, "1");

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

      const metaPro = Boolean((data.session?.user?.user_metadata as any)?.pro);

      setUnlocked(Boolean(redirectUnlocked || whitelist || metaPro));
      setLoadingAccess(false);
    })();
  }, []);

  const parsed: SimInputs = useMemo(() => {
    const base: SimInputs = {
      accountSize: clamp(toNum(inp.accountSize, 10000), 1, 10_000_000),
      profitTargetPct: clamp(toNum(inp.profitTargetPct, 8), 0, 200),
      dailyLossPct: clamp(toNum(inp.dailyLossPct, 4), 0, 100),
      maxDdPct: clamp(toNum(inp.maxDdPct, 10), 0, 100),
      riskPerTradePct: clamp(toNum(inp.riskPerTradePct, 1), 0.01, 50),
      winRatePct: clamp(toNum(inp.winRatePct, 45), 0, 100),
      rr: clamp(toNum(inp.rr, 2), 0, 50),
      tradesPerDay: Math.max(1, Math.floor(clamp(toNum(inp.tradesPerDay, 3), 1, 500))),
      days: Math.max(1, Math.floor(clamp(toNum(inp.days, 10), 1, 365))),
    };
    return base;
  }, [inp]);

  const simCount = useMemo(() => {
    const n = Math.floor(clamp(toNum(sims, 2500), 800, 8000));
    return n;
  }, [sims]);

  const result = useMemo(() => {
    if (!unlocked) return null;
    return runMonteCarlo(parsed, simCount);
  }, [parsed, simCount, unlocked]);

  return (
    <main className="text-white p-6">
      {claimedBanner && (
        <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2">
          <div className="rounded-2xl border border-white/15 bg-black/80 px-5 py-3 text-sm backdrop-blur-xl shadow-[0_0_40px_rgba(255,255,255,0.08)]">
            <div className="font-extrabold">✅ PRO Activated</div>
            <div className="text-xs opacity-70">Your purchase was linked to your account.</div>
          </div>
        </div>
      )}

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
              <GlowButton href="/login" variant="ghost">
                Login (optional)
              </GlowButton>
            </div>
            <div className="mt-4 text-xs opacity-60">
              Redirect after purchase: <span className="opacity-90">/pro?pro=1</span>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-8 grid md:grid-cols-3 gap-4">
              <StatCard title="Simulations / run" value={`${simCount}`} sub="Higher = more stable estimate" />
              <StatCard title="Model" value="Monte Carlo" sub="Randomized trade paths (variance)" />
              <StatCard title="Rules" value="Daily loss + Max DD" sub={`Evaluation stress test (${parsed.days}d x ${parsed.tradesPerDay}/day)`} />
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-end justify-between flex-wrap gap-4">
                <div>
                  <div className="text-sm opacity-70">Inputs</div>
                  <div className="text-lg font-extrabold mt-1">Set your challenge rules</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm opacity-70">Sims</div>
                  <TextNum
                    value={sims}
                    onChange={setSims}
                    className="w-28 rounded-xl border border-white/10 bg-black/40 p-2 outline-none"
                  />
                </div>
              </div>

              <div className="mt-5 grid md:grid-cols-4 gap-3">
                <Field label="Account ($)" v={inp.accountSize} setV={(x) => setInp({ ...inp, accountSize: x })} />
                <Field label="Target (%)" v={inp.profitTargetPct} setV={(x) => setInp({ ...inp, profitTargetPct: x })} />
                <Field label="Daily Loss (%)" v={inp.dailyLossPct} setV={(x) => setInp({ ...inp, dailyLossPct: x })} />
                <Field label="Max DD (%)" v={inp.maxDdPct} setV={(x) => setInp({ ...inp, maxDdPct: x })} />
                <Field label="Risk / trade (%)" v={inp.riskPerTradePct} setV={(x) => setInp({ ...inp, riskPerTradePct: x })} />
                <Field label="Winrate (%)" v={inp.winRatePct} setV={(x) => setInp({ ...inp, winRatePct: x })} />
                <Field label="RR" v={inp.rr} setV={(x) => setInp({ ...inp, rr: x })} />
                <Field label="Trades/day" v={inp.tradesPerDay} setV={(x) => setInp({ ...inp, tradesPerDay: x })} />
                <Field label="Days" v={inp.days} setV={(x) => setInp({ ...inp, days: x })} />
              </div>
            </div>

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
                  <Mini title="Runs" value={result ? `${simCount}` : "—"} />
                </div>

                <div className="mt-4 text-xs opacity-60">
                  Simplified educational model. No guarantees.
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="text-sm opacity-70">Equity curve preview</div>
                <div className="text-xs opacity-60 mt-1">One representative randomized path</div>
                <div className="mt-4">
                  <EquityChart values={result?.sampleEquity ?? [parsed.accountSize]} />
                </div>
              </div>
            </div>

            
            {result && (
              <div className="mt-6 rounded-3xl border border-white/10 bg-black/30 p-6">
                <div className="text-sm opacity-70">Failure breakdown</div>

                <div className="mt-4 grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs opacity-60 uppercase">Most common failure cause</div>
                    <div className="mt-2 text-lg font-extrabold">
                      {result.failCauseCounts.daily > result.failCauseCounts.dd
                        ? "Daily loss rule"
                        : "Max drawdown"}
                    </div>
                    <div className="mt-1 text-xs opacity-60">
                      Daily: {result.failCauseCounts.daily} • DD: {result.failCauseCounts.dd}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs opacity-60 uppercase">You usually fail around</div>
                    <div className="mt-2 text-lg font-extrabold">
                      Day {result.avgFailDay.toFixed(1)}
                    </div>
                    <div className="mt-1 text-xs opacity-60">
                      (Only counts runs that failed by rules)
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-xs opacity-60 uppercase">Failure by day</div>
                  <div className="mt-3 flex gap-1 items-end">
                    {result.failByDay.map((v: number, i: number) => {
                      const maxV = Math.max(...result.failByDay, 1);
                      const intensity = Math.min(v / maxV, 1);
                      return (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div
                            className="h-10 w-4 rounded-sm border border-white/10"
                            style={{ backgroundColor: `rgba(239,68,68,${0.15 + intensity * 0.85})` }}
                            title={`Day ${i + 1}: ${v} failures`}
                          />
                          <div className="text-[10px] opacity-60">{i + 1}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-xs opacity-60">
                    Darker red = more failures on that day (variance + rule traps).
                  </div>
                </div>
              </div>
            )}
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

function TextNum({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className: string;
}) {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(cleanNumberInput(e.target.value))}
      className={className}
    />
  );
}

function Field({ label, v, setV }: { label: string; v: string; setV: (x: string) => void }) {
  return (
    <label className="grid gap-1">
      <div className="text-sm opacity-70">{label}</div>
      <input
        type="text"
        inputMode="decimal"
        value={v}
        onChange={(e) => setV(cleanNumberInput(e.target.value))}
        className="w-full rounded-2xl border border-white/10 bg-black/40 p-3 outline-none"
      />
    </label>
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
    return { x, y, v };
  });

  const polyPoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Smooth: throttle state updates to animation frames
  const rafRef = useRef<number | null>(null);
  const pendingIdxRef = useRef<number | null>(null);

  function setIdxSmooth(idx: number) {
    pendingIdxRef.current = idx;
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (pendingIdxRef.current != null) setHoverIdx(pendingIdxRef.current);
    });
  }

  function idxFromClientX(clientX: number, rect: DOMRect) {
    const x = ((clientX - rect.left) / rect.width) * w;
    const t = (x - pad) / (w - pad * 2);
    const idx = Math.round(t * (values.length - 1));
    return Math.max(0, Math.min(values.length - 1, idx));
  }

  const hoverPoint = hoverIdx === null ? null : points[hoverIdx];

  // Tooltip positioning: clamp inside container + flip if near top
  const xPctRaw = hoverPoint ? (hoverPoint.x / w) * 100 : 50;
  const yPctRaw = hoverPoint ? (hoverPoint.y / h) * 100 : 50;
  const xPct = Math.max(6, Math.min(94, xPctRaw));
  const placeBelow = yPctRaw < 18; // if dot is near top, show tooltip below

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-3">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-auto touch-none"
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const idx = idxFromClientX(e.clientX, rect);
          setIdxSmooth(idx);
        }}
        onMouseLeave={() => setHoverIdx(null)}
        onTouchStart={(e) => {
          const t = e.touches?.[0];
          if (!t) return;
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const idx = idxFromClientX(t.clientX, rect);
          setIdxSmooth(idx);
        }}
        onTouchMove={(e) => {
          const t = e.touches?.[0];
          if (!t) return;
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const idx = idxFromClientX(t.clientX, rect);
          setIdxSmooth(idx);
        }}
        onTouchEnd={() => setHoverIdx(null)}
      >
        <polyline
          fill="none"
          stroke="white"
          strokeOpacity="0.85"
          strokeWidth="2.5"
          points={polyPoints}
        />

        <line x1="0" y1={h - 1} x2={w} y2={h - 1} stroke="white" strokeOpacity="0.08" />

        {hoverPoint && (
          <g>
            <line
              x1={hoverPoint.x}
              y1={pad}
              x2={hoverPoint.x}
              y2={h - pad}
              stroke="white"
              strokeOpacity="0.12"
            />
            <circle cx={hoverPoint.x} cy={hoverPoint.y} r="4.5" fill="white" fillOpacity="0.92" />
            <circle cx={hoverPoint.x} cy={hoverPoint.y} r="10" fill="white" fillOpacity="0.07" />
          </g>
        )}
      </svg>

      {hoverPoint && (
        <div
          className="pointer-events-none absolute z-10 rounded-xl border border-white/10 bg-black/85 px-3 py-2 text-xs backdrop-blur-xl"
          style={{
            left: `${xPct}%`,
            top: placeBelow ? `${Math.min(92, yPctRaw + 6)}%` : `${Math.max(8, yPctRaw - 6)}%`,
            transform: placeBelow ? "translate(-50%, 0%)" : "translate(-50%, -100%)",
            maxWidth: "240px",
            whiteSpace: "nowrap",
          }}
        >
          <div className="opacity-70">Step {hoverIdx! + 1}</div>
          <div className="text-sm font-extrabold">{Math.round(hoverPoint.v).toLocaleString()}</div>
        </div>
      )}

      <div className="mt-2 flex justify-between text-xs opacity-60">
        <span>min: {Math.round(min)}</span>
        <span>max: {Math.round(max)}</span>
      </div>
    </div>
  );
}
