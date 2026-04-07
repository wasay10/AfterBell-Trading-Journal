"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { formatPnl, getPnlColor } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface Summary {
  totalTrades: number; wins: number; losses: number; breakevens: number;
  winRate: number; avgWin: number; avgLoss: number; profitFactor: number;
  netPnl: number; grossProfit: number; grossLoss: number;
  maxDrawdown: number; returnPct: number;
}
interface TagStat {
  id: string; name: string; totalTrades: number; wins: number;
  losses: number; winRate: number; netPnl: number; profitFactor: number;
}
interface EquityPoint { date: string; balance: number }
interface DailyPoint { date: string; pnl: number }

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-xs">
      <p className="text-[#8b949e] mb-1">{label}</p>
      <p className="text-white font-mono font-semibold">
        ${Number(payload[0].value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
};

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [equityCurve, setEquityCurve] = useState<EquityPoint[]>([]);
  const [dailyPnl, setDailyPnl] = useState<DailyPoint[]>([]);
  const [tagStats, setTagStats] = useState<TagStat[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [ana, tags] = await Promise.all([
      fetch("/api/analytics/summary").then((r) => r.json()),
      fetch("/api/analytics/tags").then((r) => r.json()),
    ]);
    setSummary(ana.summary);
    setEquityCurve(ana.equityCurve ?? []);
    setDailyPnl(ana.dailyPnl ?? []);
    setTagStats(Array.isArray(tags) ? tags : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const s = summary;

  const statRows = s
    ? [
        { label: "Total Trades", value: s.totalTrades, cls: "text-white" },
        { label: "Wins", value: s.wins, cls: "text-[#00c853]" },
        { label: "Losses", value: s.losses, cls: "text-[#ff1744]" },
        { label: "Breakeven", value: s.breakevens, cls: "text-[#2979ff]" },
        { label: "Win Rate", value: `${s.winRate.toFixed(1)}%`, cls: "text-white" },
        { label: "Avg Win", value: `$${s.avgWin.toFixed(2)}`, cls: "text-[#00c853]" },
        { label: "Avg Loss", value: `-$${s.avgLoss.toFixed(2)}`, cls: "text-[#ff1744]" },
        { label: "Profit Factor", value: s.profitFactor === Infinity ? "∞" : s.profitFactor.toFixed(2), cls: "text-white" },
        { label: "Max Drawdown", value: `-$${s.maxDrawdown.toFixed(2)}`, cls: "text-[#ff1744]" },
        { label: "Net P&L", value: formatPnl(s.netPnl), cls: getPnlColor(s.netPnl) },
        { label: "Gross Profit", value: `$${s.grossProfit.toFixed(2)}`, cls: "text-[#00c853]" },
        { label: "Gross Loss", value: `-$${s.grossLoss.toFixed(2)}`, cls: "text-[#ff1744]" },
        { label: "Return", value: `${s.returnPct >= 0 ? "+" : ""}${s.returnPct.toFixed(2)}%`, cls: getPnlColor(s.returnPct) },
      ]
    : [];

  return (
    <AppShell title="Analytics" onTradeAdded={load}>
      <div className="p-4 space-y-4 max-w-screen-2xl mx-auto">
        {loading ? (
          <p className="text-[#8b949e] text-sm text-center py-12">Loading...</p>
        ) : (
          <>
            {/* Performance Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
                <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-widest mb-3">
                  Performance Summary
                </p>
                <div className="space-y-2">
                  {statRows.map(({ label, value, cls }) => (
                    <div key={label} className="flex justify-between items-center py-1.5 border-b border-[#21262d] last:border-0">
                      <span className="text-xs text-[#8b949e]">{label}</span>
                      <span className={`text-sm font-mono font-semibold ${cls}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equity Curve */}
              <div className="lg:col-span-2 bg-[#161b22] border border-[#21262d] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-widest">
                    Equity Curve
                  </p>
                  {s && (
                    <span className={`text-sm font-mono font-semibold ${getPnlColor(s.netPnl)}`}>
                      {formatPnl(s.netPnl)}
                    </span>
                  )}
                </div>
                {equityCurve.length > 1 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={equityCurve} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="eq2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00c853" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00c853" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fill: "#8b949e", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: "#8b949e", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="balance" stroke="#00c853" strokeWidth={2} fill="url(#eq2)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-[#8b949e] text-sm">
                    Add trades to see your equity curve.
                  </div>
                )}
              </div>
            </div>

            {/* Daily P&L */}
            <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
              <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-widest mb-3">
                Daily P&L
              </p>
              {dailyPnl.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={dailyPnl} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} style={{ background: "transparent" }}>
                    <XAxis dataKey="date" tick={{ fill: "#8b949e", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "#8b949e", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                      {dailyPnl.map((entry, i) => (
                        <Cell key={i} fill={entry.pnl >= 0 ? "#00c853" : "#ff1744"} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[160px] flex items-center justify-center text-[#8b949e] text-sm">
                  No data yet.
                </div>
              )}
            </div>

            {/* Tags Breakdown */}
            {tagStats.length > 0 && (
              <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#21262d]">
                  <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-widest">
                    Tags Breakdown
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#21262d]">
                        {["Tag", "Trades", "Win Rate", "Avg P&L", "Net P&L", "Profit Factor"].map((h) => (
                          <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tagStats.map((tag) => (
                        <tr key={tag.id} className="border-b border-[#21262d] hover:bg-[#1c2128] transition-colors">
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 bg-[#7c4dff]/20 text-[#7c4dff] rounded-full text-xs font-medium">
                              {tag.name}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[#8b949e] font-mono text-xs">{tag.totalTrades}</td>
                          <td className="px-4 py-2.5 font-mono text-xs">
                            <span className={tag.winRate >= 50 ? "text-[#00c853]" : "text-[#ff1744]"}>
                              {tag.winRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className={`px-4 py-2.5 font-mono text-xs ${getPnlColor(tag.netPnl / tag.totalTrades)}`}>
                            {formatPnl(tag.netPnl / tag.totalTrades)}
                          </td>
                          <td className={`px-4 py-2.5 font-mono text-xs font-semibold ${getPnlColor(tag.netPnl)}`}>
                            {formatPnl(tag.netPnl)}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs text-white">
                            {tag.profitFactor === Infinity ? "∞" : tag.profitFactor.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
