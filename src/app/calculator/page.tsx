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
    if (safeWinrate <= 0 || safeWinrate >= 100) return 0;
    // simple proxy: how many losses in a row is "not crazy" (5% tail)
    return Math.max(1, Math.round(Math.log(0.05) / Math.log(1 - safeWinrate / 100)));
  }, [safeWinrate]);

  const verdictColor =
    score < 40 ? "text-red-500" : score < 70 ? "text-yellow-400" : "text-green-400";

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-neutral-950 to-black text-white p-6">
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
          {/* INPUT CARD */}
          <Card>
            <Input
              label="Winrate (%)"
              tip="How often your trades win (e.g. 45 means 45 wins out of 100 trades)."
              value={winrate}
              setValue={setWinrate}
            />
            <Input
              label="RR"
              tip="Risk-to-Reward ratio. RR=2 means you aim to make 2R profit for every 1R risk."
              value={rr}
              setValue={setRr}
            />
            <Input
              label="Risk per trade (%)"
              tip="How much of your account you risk per trade. Example: 1% risk on a $10,000 account = $100 per trade."
              value={risk}
              setValue={setRisk}
            />
            <Input
              label="Daily loss limit (%)"
              tip="Your prop firm daily loss rule. Example: 4% means losing 4% in one day fails the day."
              value={dailyLoss}
              setValue={setDailyLoss}
            />
          </Card>

          {/* RESULT CARD */}
          <Card>
            <div className="text-sm opacity-70">Estimated Survival Probability</div>
            <div className={`mt-2 text-5xl font-extrabold ${verdictColor}`}>{Math.round(score)}%</div>

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
                desc={`~${lossesToDaily} consecutive losses can hit your daily limit at ${safeRisk.toFixed(1)}% risk.`}
              />
              <AlertBox
                title="Expected Losing Streak"
                value={expectedLosingStreak}
                desc="A realistic worst-case streak (variance) at your winrate."
              />
              <AlertBox
                title="Blow-up Window"
                value="Day 1–5"
                desc="Most evaluation failures happen early from variance + rule breaks."
              />
            </div>

            <div className="mt-8 flex gap-4 flex-wrap">
              <ButtonLink href="/pro">Unlock PRO (19€)</ButtonLink>

              <ButtonLink
                href="https://challengekiller.gumroad.com/l/mijmrn"
                external
                variant="ghost"
              >
                Buy on Gumroad
              </ButtonLink>
            </div>

            <div className="mt-4 text-xs opacity-50">Educational tool only. Not financial advice.</div>
          </Card>
        </div>
      </div>
    </main>
  );
}

function Card({ children }: { children: any }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      {children}
    </div>
  );
}

function ButtonLink({
  href,
  children,
  external,
  variant = "solid",
}: {
  href: string;
  children: any;
  external?: boolean;
  variant?: "solid" | "ghost";
}) {
  const base =
    "relative inline-flex items-center justify-center rounded-2xl px-6 py-3 font-extrabold transition-all duration-300 " +
    "hover:scale-[1.03] active:scale-[0.99]";

  const solid =
    "bg-white text-black hover:shadow-[0_0_30px_rgba(255,255,255,0.40)]";

  const ghost =
    "border border-white/20 text-white hover:bg-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]";

  const cls = `${base} ${variant === "solid" ? solid : ghost}`;

  return (
    <a
      href={href}
      className={cls}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
    >
      {children}
    </a>
  );
}

function Input({
  label,
  tip,
  value,
  setValue,
}: {
  label: string;
  tip: string;
  value: number | "";
  setValue: (v: number | "") => void;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <label className="block text-sm opacity-70">{label}</label>
        <HelpTip text={tip} />
      </div>

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

function HelpTip({ text }: { text: string }) {
  return (
    <span className="relative group">
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-white/5 text-xs font-extrabold opacity-80 cursor-help select-none
                   transition-all duration-200 group-hover:opacity-100 group-hover:bg-white/10"
        aria-label="Help"
        tabIndex={0}
      >
        ?
      </span>

      {/* Tooltip */}
      <span
        className="pointer-events-none absolute left-1/2 top-7 z-20 w-72 -translate-x-1/2 rounded-xl border border-white/10 bg-black/90 p-3 text-xs leading-relaxed text-white/90
                   opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0"
      >
        {text}
      </span>
    </span>
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
