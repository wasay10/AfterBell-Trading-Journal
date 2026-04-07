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
    <div className="bg-[#1E293B] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-[#94A3B8] mb-1">{label}</p>
      <p className="text-[#E2E8F0] font-mono font-semibold">
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
        { label: "Total Trades", value: s.totalTrades, cls: "text-[#E2E8F0]" },
        { label: "Wins", value: s.wins, cls: "text-[#10B981]" },
        { label: "Losses", value: s.losses, cls: "text-[#F43F5E]" },
        { label: "Breakeven", value: s.breakevens, cls: "text-[#64748B]" },
        { label: "Win Rate", value: `${s.winRate.toFixed(1)}%`, cls: "text-[#E2E8F0]" },
        { label: "Avg Win", value: `$${s.avgWin.toFixed(2)}`, cls: "text-[#10B981]" },
        { label: "Avg Loss", value: `-$${s.avgLoss.toFixed(2)}`, cls: "text-[#F43F5E]" },
        { label: "Profit Factor", value: s.profitFactor === Infinity ? "∞" : s.profitFactor.toFixed(2), cls: "text-[#E2E8F0]" },
        { label: "Max Drawdown", value: `-$${s.maxDrawdown.toFixed(2)}`, cls: "text-[#F43F5E]" },
        { label: "Net P&L", value: formatPnl(s.netPnl), cls: getPnlColor(s.netPnl) },
        { label: "Gross Profit", value: `$${s.grossProfit.toFixed(2)}`, cls: "text-[#10B981]" },
        { label: "Gross Loss", value: `-$${s.grossLoss.toFixed(2)}`, cls: "text-[#F43F5E]" },
        { label: "Return", value: `${s.returnPct >= 0 ? "+" : ""}${s.returnPct.toFixed(2)}%`, cls: getPnlColor(s.returnPct) },
      ]
    : [];

  return (
    <AppShell title="Analytics" onTradeAdded={load}>
      <div className="p-4 space-y-4 max-w-screen-2xl mx-auto">
        {loading ? (
          <p className="text-[#64748B] text-sm text-center py-12">Loading...</p>
        ) : (
          <>
            {/* Performance Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-4">
                <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-[0.5px] mb-3">
                  Performance Summary
                </p>
                <div className="space-y-2">
                  {statRows.map(({ label, value, cls }) => (
                    <div key={label} className="flex justify-between items-center py-1.5 border-b border-white/[0.05] last:border-0">
                      <span className="text-xs text-[#94A3B8]">{label}</span>
                      <span className={`text-sm font-mono font-semibold ${cls}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equity Curve */}
              <div className="lg:col-span-2 bg-[#111827] border border-white/[0.08] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-[0.5px]">
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
                          <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.08} />
                          <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: "#64748B", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="balance" stroke="#06B6D4" strokeWidth={2} fill="url(#eq2)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-[#64748B] text-sm">
                    Add trades to see your equity curve.
                  </div>
                )}
              </div>
            </div>

            {/* Daily P&L */}
            <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-4">
              <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-[0.5px] mb-3">
                Daily P&L
              </p>
              {dailyPnl.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={dailyPnl} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} style={{ background: "transparent" }}>
                    <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "#64748B", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                      {dailyPnl.map((entry, i) => (
                        <Cell key={i} fill={entry.pnl >= 0 ? "#10B981" : "#F43F5E"} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[160px] flex items-center justify-center text-[#64748B] text-sm">
                  No data yet.
                </div>
              )}
            </div>

            {/* Tags Breakdown */}
            {tagStats.length > 0 && (
              <div className="bg-[#111827] border border-white/[0.08] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.08]">
                  <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-[0.5px]">
                    Tags Breakdown
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                        {["Tag", "Trades", "Win Rate", "Avg P&L", "Net P&L", "Profit Factor"].map((h) => (
                          <th key={h} className="px-4 py-2 text-left text-[11px] font-semibold text-[#64748B] uppercase tracking-[0.5px]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tagStats.map((tag) => (
                        <tr key={tag.id} className="border-b border-white/[0.05] hover:bg-white/[0.03] transition-colors">
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 bg-[#06B6D4]/10 text-[#06B6D4] rounded text-xs font-medium border border-[#06B6D4]/20">
                              {tag.name}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[#94A3B8] font-mono text-xs">{tag.totalTrades}</td>
                          <td className="px-4 py-2.5 font-mono text-xs">
                            <span className={tag.winRate >= 50 ? "text-[#10B981]" : "text-[#F43F5E]"}>
                              {tag.winRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className={`px-4 py-2.5 font-mono text-xs ${tag.totalTrades > 0 ? getPnlColor(tag.netPnl / tag.totalTrades) : "text-[#64748B]"}`}>
                            {tag.totalTrades > 0 ? formatPnl(tag.netPnl / tag.totalTrades) : "$0.00"}
                          </td>
                          <td className={`px-4 py-2.5 font-mono text-xs font-semibold ${getPnlColor(tag.netPnl)}`}>
                            {formatPnl(tag.netPnl)}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs text-[#E2E8F0]">
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
