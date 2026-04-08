import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateSummary, buildEquityCurve, buildDailyPnl, calculateThunderScore } from "@/lib/analytics";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const trades = await prisma.trade.findMany({
    where: { userId: session.user.id },
    select: { pnl: true, date: true },
    orderBy: { date: "asc" },
  });

  const summary = calculateSummary(trades, user.startingBalance, user.breakevenCap);
  const thunder = calculateThunderScore(summary, user.startingBalance);
  const equityCurve = buildEquityCurve(trades, user.startingBalance);
  const dailyPnl = buildDailyPnl(trades);

  return NextResponse.json({ summary, thunder, equityCurve, dailyPnl, user });
}
