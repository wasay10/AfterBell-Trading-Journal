"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { formatPnl, getPnlColor } from "@/lib/utils";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ThunderScoreCard } from "@/components/charts/ThunderScoreCard";
import type { ThunderScore } from "@/lib/analytics";

interface Summary {
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
  dayWinRate: number;
}

interface EquityPoint { date: string; balance: number }
interface DailyPoint { date: string; pnl: number }
interface CalendarDay {
  day: number;
  pnl: number;
  count: number;
  result: "WIN" | "LOSS" | "BE";
}
interface WeeklyPnl { week: number; pnl: number }

interface AnalyticsData {
  summary: Summary;
  thunder: ThunderScore;
  equityCurve: EquityPoint[];
  dailyPnl: DailyPoint[];
  user: {
    displayName: string;
    email: string;
    startingBalance: number;
    currentBalance: number;
    breakevenCap: number;
  };
}

interface CalendarData {
  days: CalendarDay[];
  profitDays: number;
  lossDays: number;
  beDays: number;
  totalTrades: number;
  weeklyPnl: WeeklyPnl[];
}

function KpiCard({
  label,
  value,
  sub,
  valueClass,
  children,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 flex flex-col gap-2">
      <p className="text-xs text-[#8b949e] uppercase tracking-widest font-semibold">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className={`text-2xl font-bold font-mono ${valueClass ?? "text-white"}`}>
            {value}
          </p>
          {sub && <p className="text-xs text-[#8b949e] mt-0.5">{sub}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

function RingChart({
  value,
  max = 100,
  color,
  size = 56,
}: {
  value: number;
  max?: number;
  color: string;
  size?: number;
}) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const offset = circ * (1 - pct);

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#21262d" strokeWidth={6} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

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

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [calData, setCalData] = useState<CalendarData | null>(null);
  const [month] = useState(() => new Date().getMonth() + 1);
  const [year] = useState(() => new Date().getFullYear());

  const load = useCallback(async () => {
    const [ana, cal] = await Promise.all([
      fetch("/api/analytics/summary").then((r) => r.json()),
      fetch(`/api/analytics/calendar?year=${year}&month=${month}`).then((r) => r.json()),
    ]);
    setData(ana);
    setCalData(cal);
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const s = data?.summary;
  const user = data?.user;

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDow = new Date(year, month - 1, 1).getDay();
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const calDayMap = new Map<number, CalendarDay>();
  calData?.days.forEach((d) => calDayMap.set(d.day, d));

  // Build week labels for weekly P&L
  const weekLabels: string[] = [];
  let d = 1;
  while (d <= daysInMonth) {
    const start = d;
    const end = Math.min(d + 6, daysInMonth);
    weekLabels.push(`${start}–${end} ${monthNames[month - 1].toUpperCase()}`);
    d += 7;
  }

  return (
    <AppShell
      title="Dashboard"
      user={user}
      onTradeAdded={load}
    >
      <div className="p-4 space-y-4 max-w-screen-2xl mx-auto">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <KpiCard
            label="Net P&L"
            value={s ? formatPnl(s.netPnl) : "$0.00"}
            sub={s ? `${s.returnPct >= 0 ? "+" : ""}${s.returnPct.toFixed(2)}% return` : ""}
            valueClass={s ? getPnlColor(s.netPnl) : "text-white"}
          />
          <KpiCard
            label="Trade Win %"
            value={s ? `${s.winRate.toFixed(1)}%` : "0%"}
            sub={s ? `${s.wins}W / ${s.losses}L / ${s.breakevens}BE` : ""}
          >
            {s && <RingChart value={s.winRate} color="#00c853" />}
          </KpiCard>
          <KpiCard
            label="Profit Factor"
            value={s ? (s.profitFactor === Infinity ? "∞" : s.profitFactor.toFixed(2)) : "0.00"}
          >
            {s && <RingChart value={Math.min(s.profitFactor, 5)} max={5} color="#7c4dff" />}
          </KpiCard>
          <KpiCard
            label="Day Win %"
            value={s ? `${s.dayWinRate.toFixed(1)}%` : "0%"}
          >
            {s && <RingChart value={s.dayWinRate} color="#2979ff" />}
          </KpiCard>
          <KpiCard
            label="Avg Win / Loss"
            value={s ? `${(s.avgWin / (s.avgLoss || 1)).toFixed(2)}` : "0.00"}
            sub={s ? `+$${s.avgWin.toFixed(0)} / -$${s.avgLoss.toFixed(0)}` : ""}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Thunder Score */}
          {data?.thunder && <ThunderScoreCard thunder={data.thunder} />}
          {/* Right two charts stacked in col-span-2 */}
          <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Equity Curve */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-white">Cumulative P&L</p>
              {s && (
                <div className="flex items-center gap-3 text-sm">
                  <span className={`font-mono font-semibold ${getPnlColor(s.netPnl)}`}>
                    {formatPnl(s.netPnl)}
                  </span>
                  <span className={`text-xs ${getPnlColor(s.returnPct)}`}>
                    {s.returnPct >= 0 ? "+" : ""}{s.returnPct.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
            {data?.equityCurve && data.equityCurve.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.equityCurve} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00c853" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00c853" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: "#8b949e", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: "#8b949e", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="balance" stroke="#00c853" strokeWidth={2} fill="url(#eq)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-[#8b949e] text-sm">
                No trades yet — add your first trade to see the equity curve.
              </div>
            )}
          </div>

          {/* Daily P&L */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
            <p className="text-sm font-semibold text-white mb-3">Daily P&L</p>
            {data?.dailyPnl && data.dailyPnl.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.dailyPnl} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} style={{ background: "transparent" }}>
                  <XAxis dataKey="date" tick={{ fill: "#8b949e", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: "#8b949e", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                    {data.dailyPnl.map((entry, i) => (
                      <Cell key={i} fill={entry.pnl >= 0 ? "#00c853" : "#ff1744"} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-[#8b949e] text-sm">
                No daily data yet.
              </div>
            )}
          </div>
          </div>{/* end right col-span-2 */}
        </div>

        {/* Calendar + Weekly P&L */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white">
              {monthNames[month - 1]} {year}
            </p>
            {calData && (
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-[#00c853]">
                  <TrendingUp className="w-3 h-3" />
                  {calData.profitDays} Profit
                </span>
                <span className="flex items-center gap-1 text-[#ff1744]">
                  <TrendingDown className="w-3 h-3" />
                  {calData.lossDays} Loss
                </span>
                <span className="flex items-center gap-1 text-[#2979ff]">
                  <Minus className="w-3 h-3" />
                  {calData.beDays} B/E
                </span>
                <span className="text-[#8b949e]">{calData.totalTrades} Trades</span>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            {/* Calendar grid */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-7 gap-1 mb-1">
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                  <div key={d} className="text-xs text-[#8b949e] text-center py-1 font-medium">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDow }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const dayData = calDayMap.get(day);
                  return (
                    <div
                      key={day}
                      className={`rounded-lg p-1.5 min-h-[52px] border text-xs ${
                        dayData?.result === "WIN"
                          ? "bg-[#00c853]/10 border-[#00c853]/30"
                          : dayData?.result === "LOSS"
                          ? "bg-[#ff1744]/10 border-[#ff1744]/30"
                          : dayData?.result === "BE"
                          ? "bg-[#2979ff]/10 border-[#2979ff]/30"
                          : "bg-[#0d1117] border-[#21262d]"
                      }`}
                    >
                      <p className="text-[#8b949e] text-[10px] leading-none">{day}</p>
                      {dayData && (
                        <>
                          <p
                            className={`font-mono font-semibold text-[10px] mt-0.5 ${
                              dayData.result === "WIN"
                                ? "text-[#00c853]"
                                : dayData.result === "LOSS"
                                ? "text-[#ff1744]"
                                : "text-[#2979ff]"
                            }`}
                          >
                            {formatPnl(dayData.pnl)}
                          </p>
                          <div className="flex gap-0.5 mt-0.5">
                            {Array.from({ length: Math.min(dayData.count, 5) }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  dayData.result === "WIN"
                                    ? "bg-[#00c853]"
                                    : dayData.result === "LOSS"
                                    ? "bg-[#ff1744]"
                                    : "bg-[#2979ff]"
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekly P&L */}
            <div className="w-44 shrink-0 space-y-1.5">
              <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-widest mb-2">
                Weekly P&L
              </p>
              {calData?.weeklyPnl.map((w, i) => (
                <div
                  key={w.week}
                  className="bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2"
                >
                  <p className="text-[10px] text-[#8b949e]">{weekLabels[i] ?? `Week ${i + 1}`}</p>
                  <p
                    className={`font-mono font-semibold text-sm ${
                      w.pnl >= 0 ? "text-[#00c853]" : "text-[#ff1744]"
                    }`}
                  >
                    {formatPnl(w.pnl)}
                  </p>
                </div>
              ))}
              {(!calData?.weeklyPnl || calData.weeklyPnl.length === 0) && (
                <p className="text-xs text-[#8b949e]">No trades this month</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
