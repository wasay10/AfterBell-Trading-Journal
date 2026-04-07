import { getTradeResult } from "./utils";

export interface TradeSummary {
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  netPnl: number;
  grossProfit: number;
  grossLoss: number;
  maxDrawdown: number;
  returnPct: number;
  avgRR: number;
  dayWinRate: number;
}

export function calculateSummary(
  trades: { pnl: number; date: Date | string }[],
  startingBalance: number,
  breakevenCap = 0
): TradeSummary {
  if (!trades.length) {
    return {
      totalTrades: 0,
      wins: 0,
      losses: 0,
      breakevens: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      netPnl: 0,
      grossProfit: 0,
      grossLoss: 0,
      maxDrawdown: 0,
      returnPct: 0,
      avgRR: 0,
      dayWinRate: 0,
    };
  }

  const wins = trades.filter(
    (t) => getTradeResult(t.pnl, breakevenCap) === "WIN"
  );
  const losses = trades.filter(
    (t) => getTradeResult(t.pnl, breakevenCap) === "LOSS"
  );
  const bes = trades.filter(
    (t) => getTradeResult(t.pnl, breakevenCap) === "BE"
  );

  const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
  const netPnl = trades.reduce((sum, t) => sum + t.pnl, 0);

  const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;

  // Max drawdown calculation
  let peak = startingBalance;
  let balance = startingBalance;
  let maxDrawdown = 0;
  const sorted = [...trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  for (const t of sorted) {
    balance += t.pnl;
    if (balance > peak) peak = balance;
    const dd = peak - balance;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  // Day win rate
  const dayMap = new Map<string, number>();
  for (const t of trades) {
    const day = new Date(t.date).toDateString();
    dayMap.set(day, (dayMap.get(day) ?? 0) + t.pnl);
  }
  const dayResults = Array.from(dayMap.values());
  const dayWins = dayResults.filter((v) => v > breakevenCap).length;
  const dayWinRate =
    dayResults.length > 0 ? (dayWins / dayResults.length) * 100 : 0;

  const returnPct =
    startingBalance > 0 ? (netPnl / startingBalance) * 100 : 0;

  return {
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    breakevens: bes.length,
    winRate,
    avgWin,
    avgLoss,
    profitFactor,
    netPnl,
    grossProfit,
    grossLoss,
    maxDrawdown,
    returnPct,
    avgRR: 0,
    dayWinRate,
  };
}

export function buildEquityCurve(
  trades: { pnl: number; date: Date | string }[],
  startingBalance: number
) {
  const sorted = [...trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  let balance = startingBalance;
  const points = [
    { date: "Start", balance: startingBalance, pnl: 0 },
  ];
  for (const t of sorted) {
    balance += t.pnl;
    points.push({
      date: new Date(t.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      balance,
      pnl: t.pnl,
    });
  }
  return points;
}

export function buildDailyPnl(
  trades: { pnl: number; date: Date | string }[]
) {
  const dayMap = new Map<string, number>();
  const sorted = [...trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  for (const t of sorted) {
    const day = new Date(t.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    dayMap.set(day, (dayMap.get(day) ?? 0) + t.pnl);
  }
  return Array.from(dayMap.entries()).map(([date, pnl]) => ({ date, pnl }));
}
