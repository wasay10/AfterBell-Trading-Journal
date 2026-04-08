import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Common default assets to seed the search before the user has any trades
const DEFAULT_ASSETS = [
  "NQ", "ES", "MNQ", "MES", "RTY", "YM",
  "MGC", "XAUUSD", "GC", "SI", "CL", "NG",
  "BTC/USD", "ETH/USD", "SOL/USD",
  "EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD", "USD/CHF", "NZD/USD", "EUR/GBP",
  "AAPL", "TSLA", "NVDA", "SPY", "QQQ", "AMD",
];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get distinct assets from user's trades, ordered by most recent
  const trades = await prisma.trade.findMany({
    where: { userId: session.user.id },
    select: { asset: true },
    distinct: ["asset"],
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const userAssets = trades.map((t: { asset: string }) => t.asset);

  // Merge: user's assets first (they're most relevant), then defaults not already present
  const merged = [
    ...userAssets,
    ...DEFAULT_ASSETS.filter((a) => !userAssets.includes(a)),
  ];

  return NextResponse.json(merged);
}
