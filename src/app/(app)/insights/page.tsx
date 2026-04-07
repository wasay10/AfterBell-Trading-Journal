"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { formatPnl, getPnlColor } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, AlertTriangle, Award, Clock,
  Target, Zap, BarChart2,
} from "lucide-react";

interface Insight {
  icon: string;
  title: string;
  body: string;
  type: "positive" | "negative" | "neutral" | "warning";
}

interface SummaryData {
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  netPnl: number;
}
interface TagStat {
  name: string;
  totalTrades: number;
  winRate: number;
  netPnl: number;
}
interface EmotionStat {
  emotion: string;
  winRate: number;
  totalTrades: number;
}
interface MistakeStat {
  name: string;
  count: number;
  totalCost: number;
}

const ICON_MAP: Record<string, React.ElementType> = {
  trending_up: TrendingUp,
  trending_down: TrendingDown,
  alert: AlertTriangle,
  award: Award,
  clock: Clock,
  target: Target,
  zap: Zap,
  chart: BarChart2,
};

const TYPE_STYLES: Record<string, string> = {
  positive: "border-[#00c853]/30 bg-[#00c853]/5",
  negative: "border-[#ff1744]/30 bg-[#ff1744]/5",
  warning: "border-[#ffc107]/30 bg-[#ffc107]/5",
  neutral: "border-[#30363d] bg-[#161b22]",
};

const ICON_COLORS: Record<string, string> = {
  positive: "text-[#00c853]",
  negative: "text-[#ff1744]",
  warning: "text-[#ffc107]",
  neutral: "text-[#7c4dff]",
};

function generateInsights(
  summary: SummaryData,
  tagStats: TagStat[],
  emotionStats: EmotionStat[],
  mistakeStats: MistakeStat[]
): Insight[] {
  const insights: Insight[] = [];

  // Net P&L summary
  insights.push({
    icon: summary.netPnl >= 0 ? "trending_up" : "trending_down",
    title: "Overall Performance",
    body: `You're ${summary.netPnl >= 0 ? "up" : "down"} ${formatPnl(Math.abs(summary.netPnl))} across ${summary.totalTrades} trades with a ${summary.winRate.toFixed(1)}% win rate.`,
    type: summary.netPnl >= 0 ? "positive" : "negative",
  });

  // Profit factor
  if (summary.profitFactor >= 2) {
    insights.push({
      icon: "award",
      title: "Strong Profit Factor",
      body: `Your profit factor is ${summary.profitFactor.toFixed(2)} — for every $1 lost, you're making $${summary.profitFactor.toFixed(2)}. Excellent risk management.`,
      type: "positive",
    });
  } else if (summary.profitFactor < 1 && summary.profitFactor > 0) {
    insights.push({
      icon: "alert",
      title: "Profit Factor Below 1",
      body: `Your profit factor is ${summary.profitFactor.toFixed(2)}. You're losing more than you're making. Focus on cutting losses faster.`,
      type: "negative",
    });
  }

  // Avg win vs loss
  if (summary.avgLoss > 0 && summary.avgWin / summary.avgLoss < 1) {
    insights.push({
      icon: "alert",
      title: "Avg Loss Exceeds Avg Win",
      body: `Your average loss ($${summary.avgLoss.toFixed(0)}) is larger than your average win ($${summary.avgWin.toFixed(0)}). Consider tighter stop losses or wider targets.`,
      type: "warning",
    });
  } else if (summary.avgLoss > 0 && summary.avgWin / summary.avgLoss >= 2) {
    insights.push({
      icon: "target",
      title: "Excellent Win/Loss Ratio",
      body: `Your average win ($${summary.avgWin.toFixed(0)}) is ${(summary.avgWin / summary.avgLoss).toFixed(1)}x your average loss ($${summary.avgLoss.toFixed(0)}). Keep it up.`,
      type: "positive",
    });
  }

  // Best tag
  const sortedByPnl = [...tagStats].sort((a, b) => b.netPnl - a.netPnl);
  if (sortedByPnl[0]?.totalTrades >= 3) {
    insights.push({
      icon: "zap",
      title: `Best Setup: ${sortedByPnl[0].name}`,
      body: `Your "${sortedByPnl[0].name}" setup has generated ${formatPnl(sortedByPnl[0].netPnl)} with a ${sortedByPnl[0].winRate.toFixed(0)}% win rate across ${sortedByPnl[0].totalTrades} trades.`,
      type: "positive",
    });
  }

  // Worst tag
  if (sortedByPnl.length > 1) {
    const worst = sortedByPnl[sortedByPnl.length - 1];
    if (worst.netPnl < 0 && worst.totalTrades >= 3) {
      insights.push({
        icon: "trending_down",
        title: `Weakest Setup: ${worst.name}`,
        body: `The "${worst.name}" setup is costing you ${formatPnl(Math.abs(worst.netPnl))} total. Consider reviewing or avoiding it until refined.`,
        type: "negative",
      });
    }
  }

  // Best emotion
  const sortedByEmotion = [...emotionStats].sort((a, b) => b.winRate - a.winRate);
  if (sortedByEmotion[0]?.totalTrades >= 3) {
    insights.push({
      icon: "award",
      title: `Trade Best When: ${sortedByEmotion[0].emotion}`,
      body: `When feeling ${sortedByEmotion[0].emotion}, your win rate is ${sortedByEmotion[0].winRate.toFixed(0)}% across ${sortedByEmotion[0].totalTrades} trades. Seek this state.`,
      type: "positive",
    });
  }

  // Worst emotion
  if (sortedByEmotion.length > 1) {
    const worst = sortedByEmotion[sortedByEmotion.length - 1];
    if (worst.totalTrades >= 3 && worst.winRate < 40) {
      insights.push({
        icon: "alert",
        title: `Avoid Trading When: ${worst.emotion}`,
        body: `Your win rate when feeling ${worst.emotion} is only ${worst.winRate.toFixed(0)}%. Consider sitting out when in this state.`,
        type: "warning",
      });
    }
  }

  // Most costly mistake
  const sortedMistakes = [...mistakeStats].sort((a, b) => a.totalCost - b.totalCost);
  if (sortedMistakes[0]?.count >= 2) {
    const m = sortedMistakes[0];
    insights.push({
      icon: "alert",
      title: `Biggest Mistake: ${m.name}`,
      body: `"${m.name}" has cost you ${formatPnl(Math.abs(m.totalCost))} across ${m.count} occurrences. This is your highest priority to fix.`,
      type: "negative",
    });
  }

  // High win rate
  if (summary.winRate >= 60 && summary.totalTrades >= 10) {
    insights.push({
      icon: "chart",
      title: "High Win Rate",
      body: `${summary.winRate.toFixed(1)}% win rate on ${summary.totalTrades} trades is impressive. Ensure your R:R ratio is maintained as volume scales.`,
      type: "positive",
    });
  }

  return insights;
}

const MIN_TRADES = 5;

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [totalTrades, setTotalTrades] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [ana, tags, psych] = await Promise.all([
      fetch("/api/analytics/summary").then((r) => r.json()),
      fetch("/api/analytics/tags").then((r) => r.json()),
      fetch("/api/analytics/psychology").then((r) => r.json()),
    ]);

    const s = ana.summary;
    setTotalTrades(s?.totalTrades ?? 0);
    if (s && s.totalTrades >= MIN_TRADES) {
      setInsights(
        generateInsights(s, Array.isArray(tags) ? tags : [], psych.emotionStats ?? [], psych.mistakeStats ?? [])
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <AppShell title="Insights" onTradeAdded={load}>
      <div className="p-4 max-w-screen-lg mx-auto">
        {loading ? (
          <p className="text-[#8b949e] text-sm text-center py-12">Loading...</p>
        ) : totalTrades < MIN_TRADES ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-center mb-4">
              <BarChart2 className="w-8 h-8 text-[#8b949e]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Not enough data yet</h2>
            <p className="text-[#8b949e] text-sm max-w-sm">
              Add at least {MIN_TRADES} trades to unlock AI-powered insights about your trading patterns.
            </p>
            <p className="text-xs text-[#8b949e] mt-2">
              {totalTrades}/{MIN_TRADES} trades logged
            </p>
            <div className="mt-4 w-48 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#7c4dff] rounded-full transition-all"
                style={{ width: `${(totalTrades / MIN_TRADES) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight, i) => {
              const Icon = ICON_MAP[insight.icon] ?? BarChart2;
              return (
                <div
                  key={i}
                  className={`rounded-xl border p-4 ${TYPE_STYLES[insight.type]}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 shrink-0 ${ICON_COLORS[insight.type]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">{insight.title}</p>
                      <p className="text-xs text-[#8b949e] leading-relaxed">{insight.body}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
