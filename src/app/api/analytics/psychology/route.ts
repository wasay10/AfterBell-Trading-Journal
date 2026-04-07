import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTradeResult } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const breakevenCap = user?.breakevenCap ?? 0;

  const trades = await prisma.trade.findMany({
    where: { userId: session.user.id },
    select: { pnl: true, psychologyBefore: true, psychologyAfter: true },
  });

  // Emotion win rates
  const emotionMap = new Map<string, { wins: number; total: number; pnl: number }>();
  for (const t of trades) {
    if (!t.psychologyBefore) continue;
    const e = emotionMap.get(t.psychologyBefore) ?? { wins: 0, total: 0, pnl: 0 };
    e.total++;
    e.pnl += t.pnl;
    if (getTradeResult(t.pnl, breakevenCap) === "WIN") e.wins++;
    emotionMap.set(t.psychologyBefore, e);
  }

  const emotionStats = Array.from(emotionMap.entries()).map(([emotion, stats]) => ({
    emotion,
    winRate: (stats.wins / stats.total) * 100,
    totalTrades: stats.total,
    avgPnl: stats.pnl / stats.total,
  }));

  // Mistakes
  const mistakes = await prisma.mistake.findMany({
    where: { userId: session.user.id },
    include: {
      tradeMistakes: {
        include: { trade: { select: { pnl: true } } },
      },
    },
  });

  const mistakeStats = mistakes
    .filter((m: { tradeMistakes: unknown[] }) => m.tradeMistakes.length > 0)
    .map((m: { name: string; tradeMistakes: { trade: { pnl: number } }[] }) => ({
      name: m.name,
      count: m.tradeMistakes.length,
      totalCost: m.tradeMistakes.reduce((s: number, tm: { trade: { pnl: number } }) => s + tm.trade.pnl, 0),
      avgPnl:
        m.tradeMistakes.reduce((s: number, tm: { trade: { pnl: number } }) => s + tm.trade.pnl, 0) /
        m.tradeMistakes.length,
    }))
    .sort((a: { count: number }, b: { count: number }) => b.count - a.count);

  return NextResponse.json({ emotionStats, mistakeStats });
}
