export const dynamic = "force-dynamic";

"use client";

import { useMemo, useState } from "react";
import GlowButton from "@/components/GlowButton";
import UpgradeModal from "@/components/UpgradeModal";
import { supabase } from "@/lib/supabase";

function clamp(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, x));
}

function cleanNumberInput(raw: string) {
  let s = raw.replace(/[^0-9.]/g, "");
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
  }
  if (s === "") return "";

  const parts = s.split(".");
  let intPart = parts[0] ?? "";
  const decPart = parts[1];

  // Strip leading zeros but keep single "0"
  intPart = intPart.replace(/^0+(?=\d)/, "");
  if (intPart === "") intPart = "0";

  return decPart !== undefined ? `${intPart}.${decPart}` : intPart;
}

const FREE_SAVE_KEY = "ck_free_save_used_v1";

export default function Calculator() {
  
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string>("");
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
    if (safeWinrate <= 0 || safeWinrate >= 100) return 0;
    return Math.max(1, Math.round(Math.log(0.05) / Math.log(1 - safeWinrate / 100)));
  }, [safeWinrate]);

  const riskTier = useMemo(() => {
    if (score < 40) return "danger";
    if (score < 70) return "warn";
    return "ok";
  }, [score]);

  const verdictColor =
    riskTier === "danger" ? "text-red-500" :
    riskTier === "warn" ? "text-yellow-400" :
    "text-green-400";

  const reality = useMemo(() => {
    if (riskTier === "danger") {
      return {
        title: "Reality check: high blow-up risk",
        body:
          "At this configuration, most traders statistically fail the evaluation. " +
          "The daily loss rule + variance will catch you fast unless you reduce risk or trades/day.",
      };
    }
    if (riskTier === "warn") {
      return {
        title: "Reality check: unstable",
        body:
          "You may pass — but variance is dangerous. One losing streak can violate daily loss rules. " +
          "PRO shows the exact failure paths and how to adjust.",
      };
    }
    return {
      title: "Reality check: survivable (if disciplined)",
      body:
        "Your risk model is statistically survivable, but evaluation periods are short. " +
        "PRO stress-tests daily loss + max drawdown to expose hidden failure modes.",
    };
  }, [riskTier]);

  const dangerCardClass =
    riskTier === "danger"
      ? "border-red-500/30 bg-red-500/5 shadow-[0_0_30px_rgba(239,68,68,0.15)]"
      : riskTier === "warn"
      ? "border-yellow-400/20 bg-yellow-400/5"
      : "border-white/10 bg-black/30";

  const dangerDotClass =
    riskTier === "danger"
      ? "bg-red-500 animate-pulse"
      : riskTier === "warn"
      ? "bg-yellow-400"
      : "bg-green-400";

  
  async function handleSaveRun(currentInputs: any, currentOutputs: any) {
    setSaveMsg("");
    try {
      const used = Number(localStorage.getItem(FREE_SAVE_KEY) || "0");
      if (used >= 1) {
        setShowUpgrade(true);
        return;
      }

      // Try save to account if logged in; otherwise save locally (still counts as the one free save)
      try {
        const { data } = await supabase.auth.getSession();
        const u = data.session?.user;
        if (u) {
          await supabase.from("pro_runs").insert({
            user_id: u.id,
            email: (u.email || "").toLowerCase(),
            inputs: { ...currentInputs, source: "free" },
            outputs: { ...currentOutputs, source: "free" },
          });
          localStorage.setItem(FREE_SAVE_KEY, "1");
          setSaveMsg("Saved to your account ✅ (1 free save used)");
          return;
        }
      } catch {
        // fall back to local save
      }

      localStorage.setItem("ck_free_saved_run_v1", JSON.stringify({ inputs: currentInputs, outputs: currentOutputs }));
      localStorage.setItem(FREE_SAVE_KEY, "1");
      setSaveMsg("Saved locally ✅ (1 free save used)");
    } catch {
      setSaveMsg("Save failed.");
    }
  }

return (
    <main className="min-h-screen text-white p-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Free Pass Estimate</h1>
            <p className="mt-2 text-sm opacity-70">
              Quick risk reality-check. PRO runs full Monte Carlo simulations.
            </p>
          </div>
          <a href="/" className="text-sm underline opacity-70 hover:opacity-100">Home</a>
        </div>

        <div className="mt-10 grid md:grid-cols-2 gap-8">
          <Card>
            <Input label="Winrate (%)" tip="How often your trades win. Example: 45 = 45 wins out of 100 trades."
              value={winrate} setValue={setWinrate} />
            <Input label="RR" tip="Risk-to-Reward ratio. RR=2 means you aim to make 2R for every 1R risk."
              value={rr} setValue={setRr} />
            <Input label="Risk per trade (%)" tip="How much of your account you risk per trade. Example: 1% risk on $10k = $100."
              value={risk} setValue={setRisk} />
            <Input label="Daily loss limit (%)" tip="Your prop firm daily loss rule. Example: 4% means losing 4% in one day fails the day."
              value={dailyLoss} setValue={setDailyLoss} />
          </Card>

          <Card>
            <div className="text-sm opacity-70">Estimated Survival Probability</div>
            <div className={`mt-2 text-5xl font-extrabold ${verdictColor}`}>{Math.round(score)}%</div>

            <div className="mt-4 h-3 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-3 bg-white transition-all duration-700 ease-out" style={{ width: `${Math.round(score)}%` }} />
            </div>

            <div className={`mt-5 rounded-2xl border p-4 ${dangerCardClass}`}>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${dangerDotClass}`} />
                <div className="text-sm font-extrabold">{reality.title}</div>
              </div>
              <div className="mt-2 text-sm opacity-80">{reality.body}</div>
              <div className="mt-2 text-xs opacity-60">
                Most evaluation failures happen early (Day 1–5) from variance + rule breaks.
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <KpiBox
                title="Losses to Daily Kill"
                value={lossesToDaily}
                desc={`~${lossesToDaily} consecutive losses can hit your daily limit at ${safeRisk.toFixed(1)}% risk.`}
              />
              <KpiBox
                title="Expected Losing Streak"
                value={expectedLosingStreak}
                desc="A realistic worst-case streak (variance) at your winrate."
              />
            </div>

            <div className="mt-8 flex gap-4 flex-wrap">
                <GlowButton href="/pro">Go PRO</GlowButton>

                <button
                  onClick={() =>
                    handleSaveRun(
                      { winrate, rr, riskPerTrade: risk, dailyLossLimit: dailyLoss },
                      { survivalProbability: score, lossesToDailyKill: lossesToDaily, expectedLosingStreak }
                    )
                  }
                  className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold hover:bg-white/15 transition"
                >
                  Save run
                </button>

                <GlowButton href="https://challengekiller.gumroad.com/l/mijmrn" external variant="ghost">
                  Buy on Gumroad
                </GlowButton>
              </div>

            <div className="mt-3 text-xs opacity-70">
              PRO shows <span className="font-bold">where you statistically blow it</span> and generates a survival plan.
            </div>

            <div className="mt-4 text-xs opacity-50">Educational tool only. Not financial advice.</div>
          </Card>
        </div>
      </div>

      {/* local helper */}
      <style jsx global>{`
        /* nothing */
      `}</style>
    
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        gumroadUrl={process.env.NEXT_PUBLIC_GUMROAD_URL}
      />
</main>
  );

  function Input({
    label, tip, value, setValue,
  }: {
    label: string; tip: string; value: number | ""; setValue: (v: number | "") => void;
  }) {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <label className="text-sm opacity-70">{label}</label>
          <HelpTip text={tip} />
        </div>

        <input
          type="text"
          inputMode="decimal"
          value={value === "" ? "" : String(value)}
          onChange={(e) => {
            const cleaned = cleanNumberInput(e.target.value);
            if (cleaned === "") return setValue("");
            setValue(Number(cleaned));
          }}
          className="w-full rounded-2xl border border-white/10 bg-black/40 p-3 outline-none focus:ring-2 focus:ring-white/30 transition-all"
        />
      </div>
    );
  }
}

function Card({ children }: { children: any }) {
  return <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">{children}</div>;
}

function HelpTip({ text }: { text: string }) {
  return (
    <span className="relative group">
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-white/5 text-xs font-extrabold opacity-80 cursor-help select-none
                   transition-all duration-200 group-hover:opacity-100 group-hover:bg-white/10"
        tabIndex={0}
        aria-label="Help"
      >
        ?
      </span>
      <span
        className="pointer-events-none absolute left-1/2 top-7 z-20 w-72 -translate-x-1/2 rounded-xl border border-white/10 bg-black/90 p-3 text-xs leading-relaxed text-white/90
                   opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0"
      >
        {text}
      </span>
    </span>
  );
}

function KpiBox({ title, value, desc }: { title: string; value: any; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="text-xs uppercase tracking-wide opacity-60">{title}</div>
      <div className="mt-1 text-2xl font-extrabold text-red-500">{value}</div>
      <div className="mt-1 text-xs opacity-70">{desc}</div>
    </div>
  );
}