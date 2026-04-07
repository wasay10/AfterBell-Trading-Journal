import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTradeResult } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const breakevenCap = user?.breakevenCap ?? 0;

  const tags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    include: {
      tradeTags: {
        include: { trade: { select: { pnl: true } } },
      },
    },
  });

  const result = tags.map((tag) => {
    const trades = tag.tradeTags.map((tt: { trade: { pnl: number } }) => tt.trade);
    const wins = trades.filter((t: { pnl: number }) => getTradeResult(t.pnl, breakevenCap) === "WIN").length;
    const losses = trades.filter((t: { pnl: number }) => getTradeResult(t.pnl, breakevenCap) === "LOSS").length;
    const grossProfit = trades
      .filter((t: { pnl: number }) => t.pnl > breakevenCap)
      .reduce((s: number, t: { pnl: number }) => s + t.pnl, 0);
    const grossLoss = Math.abs(
      trades
        .filter((t: { pnl: number }) => t.pnl < -breakevenCap)
        .reduce((s: number, t: { pnl: number }) => s + t.pnl, 0)
    );
    const netPnl = trades.reduce((s: number, t: { pnl: number }) => s + t.pnl, 0);
    const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
    const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

    return {
      id: tag.id,
      name: tag.name,
      totalTrades: trades.length,
      wins,
      losses,
      winRate,
      netPnl,
      profitFactor,
    };
  });

  return NextResponse.json(
    result.sort((a: { totalTrades: number }, b: { totalTrades: number }) => b.totalTrades - a.totalTrades)
  );
}
