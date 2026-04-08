import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTradeResult } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const breakevenCap = user?.breakevenCap ?? 0;

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const trades = await prisma.trade.findMany({
    where: {
      userId: session.user.id,
      date: { gte: start, lte: end },
    },
    select: { pnl: true, date: true, id: true },
    orderBy: { date: "asc" },
  });

  // Group by day
  const dayMap = new Map<number, { pnl: number; count: number }>();
  for (const t of trades) {
    const day = new Date(t.date).getDate();
    const existing = dayMap.get(day) ?? { pnl: 0, count: 0 };
    dayMap.set(day, { pnl: existing.pnl + t.pnl, count: existing.count + 1 });
  }

  // Weekly P&L
  const weekMap = new Map<number, number>();
  for (const t of trades) {
    const d = new Date(t.date);
    const dayOfWeek = d.getDay(); // 0=Sun
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - dayOfWeek);
    const key = weekStart.getDate();
    weekMap.set(key, (weekMap.get(key) ?? 0) + t.pnl);
  }

  const days = Array.from(dayMap.entries()).map(([day, { pnl, count }]) => ({
    day,
    pnl,
    count,
    result: getTradeResult(pnl, breakevenCap),
  }));

  const profitDays = days.filter((d) => d.result === "WIN").length;
  const lossDays = days.filter((d) => d.result === "LOSS").length;
  const beDays = days.filter((d) => d.result === "BE").length;

  return NextResponse.json({
    days,
    profitDays,
    lossDays,
    beDays,
    totalTrades: trades.length,
    weeklyPnl: Array.from(weekMap.entries()).map(([week, pnl]) => ({ week, pnl })),
  });
}
