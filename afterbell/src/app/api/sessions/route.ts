import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.tradingSession.findMany({
    where: { userId: session.user.id },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, startTime, endTime, timezone } = await req.json();
  if (!name || !startTime || !endTime) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const tradingSession = await prisma.tradingSession.create({
    data: {
      userId: session.user.id,
      name,
      startTime,
      endTime,
      timezone: timezone ?? "America/New_York",
    },
  });

  return NextResponse.json(tradingSession, { status: 201 });
}
