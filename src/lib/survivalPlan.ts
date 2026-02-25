import { simulatePassProbability, SimInputs } from "@/lib/montecarlo";

export type Plan = {
  recommendedRiskPerTradePct: number;
  recommendedTradesPerDay: number;
  targetPassPct: number;
  achievedPassPct: number;
  notes: string[];
};

export function buildSurvivalPlan(inputs: SimInputs): Plan {
  const targetPassPct = 70;

  // Start from user's current settings
  let bestRisk = clamp(inputs.riskPerTradePct, 0.05, 5);
  let bestTrades = clampInt(inputs.tradesPerDay, 1, 20);

  // We try reducing risk and trades until passProb hits target.
  // Keep it fast: fewer runs during search.
  let achieved = 0;

  // First try: reduce risk only
  for (let r = bestRisk; r >= 0.1; r -= 0.1) {
    const test: SimInputs = { ...inputs, riskPerTradePct: round1(r), tradesPerDay: bestTrades };
    const p = simulatePassProbability(test, 1200).passProb * 100;
    if (p >= targetPassPct) {
      bestRisk = round1(r);
      achieved = p;
      break;
    }
    achieved = Math.max(achieved, p);
  }

  // If not enough, reduce trades/day too
  if (achieved < targetPassPct) {
    let found = false;
    for (let t = bestTrades; t >= 1; t--) {
      for (let r = bestRisk; r >= 0.1; r -= 0.1) {
        const test: SimInputs = { ...inputs, riskPerTradePct: round1(r), tradesPerDay: t };
        const p = simulatePassProbability(test, 1200).passProb * 100;
        if (p >= targetPassPct) {
          bestTrades = t;
          bestRisk = round1(r);
          achieved = p;
          found = true;
          break;
        }
        achieved = Math.max(achieved, p);
      }
      if (found) break;
    }
  }

  const notes: string[] = [];
  const lossesToDaily = inputs.dailyLossPct > 0 && bestRisk > 0 ? Math.ceil(inputs.dailyLossPct / bestRisk) : 0;
  if (lossesToDaily > 0) notes.push(`At ${bestRisk.toFixed(1)}% risk, ~${lossesToDaily} losses can hit daily loss.`);
  notes.push("Lower trades/day reduces variance (most evaluation fails are variance + rule breaks).");
  notes.push("If you want faster pass odds, increase RR (not risk).");

  return {
    recommendedRiskPerTradePct: bestRisk,
    recommendedTradesPerDay: bestTrades,
    targetPassPct,
    achievedPassPct: Math.round(achieved),
    notes,
  };
}

function clamp(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, x));
}
function clampInt(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, Math.round(x)));
}
function round1(x: number) {
  return Math.round(x * 10) / 10;
}
