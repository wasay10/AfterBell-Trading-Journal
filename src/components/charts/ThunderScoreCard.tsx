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

function getScoreColor(score: number) {
  if (score >= 70) return "#00c853";
  if (score >= 50) return "#ffc107";
  if (score >= 30) return "#ff9800";
  return "#ff1744";
}

function getScoreLabel(score: number) {
  if (score >= 70) return "Strong";
  if (score >= 50) return "Decent";
  if (score >= 30) return "Weak";
  return "Poor";
}

// MaxDD gauge bar — gradient from red → orange → yellow → green
function MaxDdBar({ pct }: { pct: number }) {
  // Clamp 0–50% DD range for display (50%+ is full red end)
  const markerPos = Math.min((pct / 50) * 100, 100);

  return (
    <div>
      <div className="flex justify-between text-[10px] text-[#8b949e] mb-1">
        <span>Max DD</span>
        <span className="font-mono">{pct.toFixed(1)}%</span>
      </div>
      <div className="relative h-2 rounded-full overflow-visible"
        style={{
          background: "linear-gradient(to right, #ff1744, #ff9800, #ffc107, #00c853)",
        }}
      >
        {/* Marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white bg-[#0d1117] shadow-md transition-all"
          style={{ left: `calc(${100 - markerPos}% - 6px)` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-[#8b949e] mt-1">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}

export function ThunderScoreCard({ thunder }: Props) {
  const color = getScoreColor(thunder.total);

  const radarData = [
    { axis: "Win %",      value: thunder.winPct },
    { axis: "Recovery",   value: thunder.recovery },
    { axis: "PF",         value: thunder.profitFactor },
    { axis: "AVG W/L",    value: thunder.avgWL },
    { axis: "Consist.",   value: thunder.consistency },
  ];

  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2">
        <Zap className="w-3.5 h-3.5 text-[#ffc107] fill-[#ffc107]" />
        <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-widest">
          Thunder Score
        </p>
      </div>

      {/* Radar */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height={180}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid
              stroke="#30363d"
              gridType="polygon"
            />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: "#8b949e", fontSize: 10, fontWeight: 500 }}
              tickLine={false}
            />
            <Radar
              name="Score"
              dataKey="value"
              stroke={color}
              fill={color}
              fillOpacity={0.25}
              strokeWidth={2}
              dot={{ r: 3, fill: color, strokeWidth: 0 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* MaxDD Bar */}
      <div className="mt-1 mb-3">
        <MaxDdBar pct={thunder.maxDrawdownPct} />
      </div>

      {/* Score */}
      <div className="text-center">
        <p
          className="text-5xl font-black font-mono leading-none"
          style={{ color }}
        >
          {thunder.total}
        </p>
        <p className="text-xs font-semibold mt-1 uppercase tracking-widest" style={{ color }}>
          {getScoreLabel(thunder.total)}
        </p>
        <p className="text-[10px] text-[#8b949e] mt-0.5 uppercase tracking-widest">
          Thunder Score
        </p>
      </div>
    </div>
  );
}
