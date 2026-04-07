"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { Zap } from "lucide-react";
import type { ThunderScore } from "@/lib/analytics";

interface Props {
  thunder: ThunderScore;
}

function getScoreLabel(score: number) {
  if (score >= 70) return "Strong";
  if (score >= 50) return "Decent";
  if (score >= 30) return "Weak";
  return "Poor";
}

function MaxDdBar({ pct }: { pct: number }) {
  const markerPos = Math.min((pct / 50) * 100, 100);

  return (
    <div>
      <div className="flex justify-between text-[10px] text-[#94A3B8] mb-1">
        <span>Max Drawdown</span>
        <span className="font-mono">{pct.toFixed(1)}%</span>
      </div>
      <div
        className="relative h-1.5 rounded-full overflow-visible"
        style={{
          background: "linear-gradient(to right, #F43F5E, #F59E0B, #10B981)",
        }}
      >
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white/20 bg-[#0A0E12] shadow-sm transition-all"
          style={{ left: `calc(${100 - markerPos}% - 6px)` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-[#64748B] mt-1">
        <span>0%</span>
        <span>25%</span>
        <span>50%+</span>
      </div>
    </div>
  );
}

export function ThunderScoreCard({ thunder }: Props) {
  const radarData = [
    { axis: "Win %",     value: thunder.winPct },
    { axis: "Recovery",  value: thunder.recovery },
    { axis: "PF",        value: thunder.profitFactor },
    { axis: "AVG W/L",   value: thunder.avgWL },
    { axis: "Consist.",  value: thunder.consistency },
  ];

  return (
    <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-4 flex flex-col">
      <div className="flex items-center gap-1.5 mb-2">
        <Zap className="w-3.5 h-3.5 text-[#06B6D4]" />
        <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-[0.5px]">
          Thunder Score
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height={180}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="rgba(255,255,255,0.06)" gridType="polygon" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 500 }}
              tickLine={false}
            />
            <Radar
              name="Score"
              dataKey="value"
              stroke="#06B6D4"
              fill="#06B6D4"
              fillOpacity={0.15}
              strokeWidth={2}
              dot={{ r: 3, fill: "#06B6D4", strokeWidth: 0 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-1 mb-3">
        <MaxDdBar pct={thunder.maxDrawdownPct} />
      </div>

      <div className="text-center">
        <p className="text-5xl font-black font-mono leading-none text-[#06B6D4]">
          {thunder.total}
        </p>
        <p className="text-[11px] font-semibold mt-1 uppercase tracking-widest text-[#94A3B8]">
          {getScoreLabel(thunder.total)}
        </p>
        <p className="text-[10px] text-[#64748B] mt-0.5 uppercase tracking-widest">
          Thunder Score
        </p>
      </div>
    </div>
  );
}
