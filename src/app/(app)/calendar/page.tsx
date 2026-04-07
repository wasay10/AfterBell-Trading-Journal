"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { formatPnl } from "@/lib/utils";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CalendarDay {
  day: number; pnl: number; count: number;
  result: "WIN" | "LOSS" | "BE";
}
interface WeeklyPnl { week: number; pnl: number }
interface CalendarData {
  days: CalendarDay[];
  profitDays: number; lossDays: number; beDays: number;
  totalTrades: number;
  weeklyPnl: WeeklyPnl[];
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const SHORT_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/analytics/calendar?year=${year}&month=${month}`);
    const d = await res.json();
    setData(d);
    setLoading(false);
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDow = new Date(year, month - 1, 1).getDay();

  const calDayMap = new Map<number, CalendarDay>();
  data?.days.forEach((d) => calDayMap.set(d.day, d));

  const weekLabels: string[] = [];
  let d = 1;
  while (d <= daysInMonth) {
    const start = d;
    const end = Math.min(d + 6, daysInMonth);
    weekLabels.push(`${start}–${end} ${SHORT_MONTHS[month - 1].toUpperCase()}`);
    d += 7;
  }

  return (
    <AppShell title="Calendar" onTradeAdded={load}>
      <div className="p-4 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-white/10 text-[#94A3B8] hover:text-[#E2E8F0] hover:border-white/20 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-semibold text-[#E2E8F0] w-44 text-center">
              {MONTH_NAMES[month - 1]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-white/10 text-[#94A3B8] hover:text-[#E2E8F0] hover:border-white/20 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {data && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-[#10B981]">
                <TrendingUp className="w-4 h-4" />
                <span className="font-semibold">{data.profitDays}</span>
                <span className="text-[#64748B] text-xs">Profit</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#F43F5E]">
                <TrendingDown className="w-4 h-4" />
                <span className="font-semibold">{data.lossDays}</span>
                <span className="text-[#64748B] text-xs">Loss</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#64748B]">
                <Minus className="w-4 h-4" />
                <span className="font-semibold">{data.beDays}</span>
                <span className="text-[#64748B] text-xs">B/E</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#94A3B8]">
                <span className="font-semibold">{data.totalTrades}</span>
                <span className="text-[#64748B] text-xs">Trades</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          {/* Calendar Grid */}
          <div className="flex-1 min-w-0 bg-[#111827] border border-white/[0.08] rounded-xl p-4">
            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-[#64748B] py-1 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {loading ? (
              <div className="h-[400px] flex items-center justify-center text-[#64748B] text-sm">
                Loading...
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: firstDow }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[72px]" />
                ))}

                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const dayData = calDayMap.get(day);
                  const isToday =
                    day === today.getDate() &&
                    month === today.getMonth() + 1 &&
                    year === today.getFullYear();

                  return (
                    <div
                      key={day}
                      className={`rounded-xl p-2 min-h-[72px] border transition-colors ${
                        isToday ? "ring-1 ring-[#06B6D4] ring-offset-0" : ""
                      } ${
                        dayData?.result === "WIN"
                          ? "bg-[#10B981]/[0.12] border-[#10B981]/25"
                          : dayData?.result === "LOSS"
                          ? "bg-[#F43F5E]/[0.12] border-[#F43F5E]/25"
                          : dayData?.result === "BE"
                          ? "bg-[#64748B]/[0.12] border-[#64748B]/25"
                          : "bg-[#0A0E12] border-white/[0.06]"
                      }`}
                    >
                      <p className={`text-xs leading-none mb-1 ${isToday ? "text-[#06B6D4] font-bold" : "text-[#64748B]"}`}>
                        {day}
                      </p>
                      {dayData && (
                        <>
                          <p className={`font-mono font-semibold text-xs ${
                            dayData.result === "WIN" ? "text-[#10B981]"
                            : dayData.result === "LOSS" ? "text-[#F43F5E]"
                            : "text-[#64748B]"
                          }`}>
                            {formatPnl(dayData.pnl)}
                          </p>
                          <div className="flex gap-0.5 mt-1 flex-wrap">
                            {Array.from({ length: Math.min(dayData.count, 6) }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  dayData.result === "WIN" ? "bg-[#10B981]"
                                  : dayData.result === "LOSS" ? "bg-[#F43F5E]"
                                  : "bg-[#64748B]"
                                }`}
                              />
                            ))}
                            {dayData.count > 6 && (
                              <span className="text-[9px] text-[#64748B]">+{dayData.count - 6}</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Weekly P&L sidebar */}
          <div className="w-48 shrink-0 space-y-2">
            <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-widest mb-2">
              Weekly P&L
            </p>
            {data?.weeklyPnl.map((w, i) => (
              <div
                key={w.week}
                className={`rounded-xl border p-3 ${
                  w.pnl >= 0
                    ? "bg-[#10B981]/[0.08] border-[#10B981]/20"
                    : "bg-[#F43F5E]/[0.08] border-[#F43F5E]/20"
                }`}
              >
                <p className="text-[10px] text-[#64748B] mb-0.5">{weekLabels[i] ?? `Week ${i + 1}`}</p>
                <p className={`font-mono font-bold text-sm ${w.pnl >= 0 ? "text-[#10B981]" : "text-[#F43F5E]"}`}>
                  {formatPnl(w.pnl)}
                </p>
              </div>
            ))}
            {(!data?.weeklyPnl || data.weeklyPnl.length === 0) && !loading && (
              <p className="text-xs text-[#64748B]">No trades this month</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
