"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { formatPnl } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface EmotionStat {
  emotion: string; winRate: number; totalTrades: number; avgPnl: number;
}
interface MistakeStat {
  name: string; count: number; totalCost: number; avgPnl: number;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1E293B] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-[#94A3B8] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[#E2E8F0] font-mono">
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
          {p.name === "Win Rate" ? "%" : ""}
        </p>
      ))}
    </div>
  );
};

export default function PsychologyPage() {
  const [emotionStats, setEmotionStats] = useState<EmotionStat[]>([]);
  const [mistakeStats, setMistakeStats] = useState<MistakeStat[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/analytics/psychology");
    const data = await res.json();
    setEmotionStats(data.emotionStats ?? []);
    setMistakeStats(data.mistakeStats ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <AppShell title="Psychology" onTradeAdded={load}>
      <div className="p-4 space-y-4 max-w-screen-xl mx-auto">
        {loading ? (
          <p className="text-[#64748B] text-sm text-center py-12">Loading...</p>
        ) : (
          <>
            {/* Emotion Win Rates */}
            <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-4">
              <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-[0.5px] mb-4">
                Win Rate by Emotion (Before Trade)
              </p>
              {emotionStats.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={emotionStats} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <XAxis dataKey="emotion" tick={{ fill: "#64748B", fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "#64748B", fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                      <Bar dataKey="winRate" name="Win Rate" radius={[4, 4, 0, 0]}>
                        {emotionStats.map((entry, i) => (
                          <Cell key={i} fill={entry.winRate >= 50 ? "#10B981" : "#F43F5E"} fillOpacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                          {["Emotion", "Trades", "Win Rate", "Avg P&L"].map((h) => (
                            <th key={h} className="px-3 py-2 text-left text-[#64748B] uppercase tracking-[0.5px] font-semibold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...emotionStats]
                          .sort((a, b) => b.winRate - a.winRate)
                          .map((e) => (
                            <tr key={e.emotion} className="border-b border-white/[0.05] hover:bg-white/[0.03] transition-colors">
                              <td className="px-3 py-2.5 font-medium text-[#E2E8F0]">{e.emotion}</td>
                              <td className="px-3 py-2.5 text-[#94A3B8] font-mono">{e.totalTrades}</td>
                              <td className="px-3 py-2.5 font-mono font-semibold">
                                <span className={e.winRate >= 50 ? "text-[#10B981]" : "text-[#F43F5E]"}>
                                  {e.winRate.toFixed(1)}%
                                </span>
                              </td>
                              <td className={`px-3 py-2.5 font-mono font-semibold ${e.avgPnl >= 0 ? "text-[#10B981]" : "text-[#F43F5E]"}`}>
                                {formatPnl(e.avgPnl)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-[#64748B] text-sm">
                  Log trades with psychology data to see emotion analysis.
                </div>
              )}
            </div>

            {/* Mistakes */}
            <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-4">
              <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-[0.5px] mb-4">
                Mistakes Overview
              </p>
              {mistakeStats.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={mistakeStats.slice(0, 10)}
                      layout="vertical"
                      margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
                    >
                      <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: "#64748B", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={100}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const d = mistakeStats.find((m) => m.name === label);
                          return (
                            <div className="bg-[#1E293B] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
                              <p className="text-[#E2E8F0] font-semibold mb-1">{label}</p>
                              <p className="text-[#94A3B8]">Count: <span className="text-[#E2E8F0]">{d?.count}</span></p>
                              <p className="text-[#94A3B8]">Total Cost: <span className="text-[#F43F5E]">{d ? formatPnl(d.totalCost) : ""}</span></p>
                              <p className="text-[#94A3B8]">Avg P&L: <span className={d && d.avgPnl >= 0 ? "text-[#10B981]" : "text-[#F43F5E]"}>{d ? formatPnl(d.avgPnl) : ""}</span></p>
                            </div>
                          );
                        }}
                        cursor={{ fill: "rgba(255,255,255,0.03)" }}
                      />
                      <Bar dataKey="count" fill="#F43F5E" fillOpacity={0.75} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                          {["Mistake", "Count", "Total Cost", "Avg P&L"].map((h) => (
                            <th key={h} className="px-3 py-2 text-left text-[#64748B] uppercase tracking-[0.5px] font-semibold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {mistakeStats.map((m) => (
                          <tr key={m.name} className="border-b border-white/[0.05] hover:bg-white/[0.03] transition-colors">
                            <td className="px-3 py-2.5">
                              <span className="px-2 py-0.5 bg-[#F43F5E]/15 text-[#F43F5E] rounded text-[10px] border border-[#F43F5E]/20">
                                {m.name}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-[#94A3B8] font-mono">{m.count}</td>
                            <td className="px-3 py-2.5 font-mono font-semibold text-[#F43F5E]">
                              {formatPnl(m.totalCost)}
                            </td>
                            <td className={`px-3 py-2.5 font-mono font-semibold ${m.avgPnl >= 0 ? "text-[#10B981]" : "text-[#F43F5E]"}`}>
                              {formatPnl(m.avgPnl)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="h-[120px] flex items-center justify-center text-[#64748B] text-sm">
                  No mistakes logged yet. That&apos;s either great or you haven&apos;t logged them yet.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
