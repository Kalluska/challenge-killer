export type SimInputs = {
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

export function simulatePassProbability(i: SimInputs, runs = 3000) {
  const target = i.accountSize * (i.profitTargetPct / 100);
  const dailyLoss = i.accountSize * (i.dailyLossPct / 100);
  const maxDd = i.accountSize * (i.maxDdPct / 100);

  const p = clamp01(i.winRatePct / 100);
  const riskMoney = i.accountSize * (i.riskPerTradePct / 100);

  let pass = 0;
  let avgFailDaySum = 0;

  for (let r = 0; r < runs; r++) {
    let pnl = 0;
    let peak = 0;
    let failed = false;
    let failDay = i.days;

    for (let d = 1; d <= i.days; d++) {
      let dayPnl = 0;

      for (let t = 0; t < i.tradesPerDay; t++) {
        const win = Math.random() < p;
        const delta = win ? riskMoney * i.rr : -riskMoney;

        pnl += delta;
        dayPnl += delta;

        peak = Math.max(peak, pnl);
        const ddFromPeak = peak - pnl;

        if (-dayPnl >= dailyLoss || ddFromPeak >= maxDd) {
          failed = true;
          failDay = d;
          break;
        }
        if (pnl >= target) break;
      }

      if (failed || pnl >= target) break;
    }

    if (!failed && pnl >= target) {
      pass++;
    } else {
      avgFailDaySum += failDay;
    }
  }

  const failCount = runs - pass;
  const avgFailDay = failCount > 0 ? avgFailDaySum / failCount : 0;

  return {
    passProb: pass / runs,
    avgFailDay,
  };
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}
