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

  const expectancy =
    (safeWinrate / 100) * safeRr - (1 - safeWinrate / 100);

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
    return Math.max(
      1,
      Math.round(Math.log(0.05) / Math.log(1 - safeWinrate / 100))
    );
  }, [safeWinrate]);

  const verdictColor =
    score < 40
      ? "text-red-500"
      : score < 70
      ? "text-yellow-400"
      : "text-green-400";

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-neutral-950 to-black text-white p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-extrabold mb-8">
          Free Pass Estimate
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <Input
              label="Winrate (%)"
              tip="How often your trades win. Example: 45 = 45 wins out of 100 trades."
              value={winrate}
              setValue={setWinrate}
            />
            <Input
              label="RR"
              tip="Risk-to-Reward ratio. RR=2 means you aim to make 2R for every 1R risk."
              value={rr}
              setValue={setRr}
            />
            <Input
              label="Risk per trade (%)"
              tip="How much of your account you risk per trade. Example: 1% risk on $10k = $100."
              value={risk}
              setValue={setRisk}
            />
            <Input
              label="Daily loss limit (%)"
              tip="Your prop firm daily loss rule. Example: 4% means losing 4% in one day fails."
              value={dailyLoss}
              setValue={setDailyLoss}
            />
          </Card>

          <Card>
            <div className="text-sm opacity-70">
              Estimated Survival Probability
            </div>

            <div
              className={`mt-2 text-5xl font-extrabold ${verdictColor}`}
            >
              {Math.round(score)}%
            </div>

            <div className="mt-4 h-3 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-3 bg-white transition-all duration-700 ease-out"
                style={{ width: `${Math.round(score)}%` }}
              />
            </div>

            <div className="mt-6 space-y-4">
              <AlertBox
                title="Losses to Daily Kill"
                value={lossesToDaily}
                desc="Consecutive losses to hit daily limit."
              />
              <AlertBox
                title="Expected Losing Streak"
                value={expectedLosingStreak}
                desc="Realistic worst-case variance."
              />
            </div>

            <div className="mt-8 flex gap-4">
              <Button href="/pro">Unlock PRO (19€)</Button>
              <Button
                href="https://challengekiller.gumroad.com/l/mijmrn"
                external
                ghost
              >
                Buy on Gumroad
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

function Card({ children }: any) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      {children}
    </div>
  );
}

function Button({
  href,
  children,
  external,
  ghost,
}: any) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={`relative inline-flex items-center justify-center rounded-2xl px-6 py-3 font-extrabold transition-all duration-300
      hover:scale-105 active:scale-95 ${
        ghost
          ? "border border-white/20 hover:bg-white/10 hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]"
          : "bg-white text-black hover:shadow-[0_0_30px_rgba(255,255,255,0.40)]"
      }`}
    >
      {children}
    </a>
  );
}

function Input({ label, tip, value, setValue }: any) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <label className="text-sm opacity-70">{label}</label>
        <HelpTip text={tip} />
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) =>
          setValue(e.target.value === "" ? "" : Number(e.target.value))
        }
        className="w-full rounded-2xl border border-white/10 bg-black/40 p-3 outline-none focus:ring-2 focus:ring-white/30 transition-all"
      />
    </div>
  );
}

function HelpTip({ text }: any) {
  return (
    <span className="relative group cursor-help">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-white/5 text-xs font-bold opacity-80 group-hover:opacity-100">
        ?
      </span>
      <span className="absolute left-1/2 top-7 -translate-x-1/2 w-64 rounded-xl border border-white/10 bg-black/90 p-3 text-xs opacity-0 group-hover:opacity-100 transition-all">
        {text}
      </span>
    </span>
  );
}

function AlertBox({ title, value, desc }: any) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="text-xs uppercase opacity-60">{title}</div>
      <div className="text-2xl font-extrabold text-red-500">{value}</div>
      <div className="text-xs opacity-70">{desc}</div>
    </div>
  );
}