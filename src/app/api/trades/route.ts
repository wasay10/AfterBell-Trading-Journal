import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const asset = searchParams.get("asset");
  const direction = searchParams.get("direction");
  const sessionId = searchParams.get("sessionId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = { userId: session.user.id };
  if (asset) where.asset = { contains: asset, mode: "insensitive" };
  if (direction) where.direction = direction;
  if (sessionId) where.sessionId = sessionId;
  if (from || to) {
    where.date = {};
    if (from) (where.date as Record<string, unknown>).gte = new Date(from);
    if (to) (where.date as Record<string, unknown>).lte = new Date(to);
  }

  const [trades, total] = await Promise.all([
    prisma.trade.findMany({
      where,
      include: {
        tradeTags: { include: { tag: true } },
        tradeMistakes: { include: { mistake: true } },
        screenshots: { orderBy: { order: "asc" } },
        session: true,
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.trade.count({ where }),
  ]);

  return NextResponse.json({ trades, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    asset,
    direction,
    date,
    pnl,
    rr,
    sessionId,
    rating,
    letterRating,
    notes,
    psychologyBefore,
    psychologyAfter,
    tagIds,
    mistakeIds,
    newTags,
    newMistakes,
  } = body;

  if (!asset || !direction || !date || pnl == null || isNaN(Number(pnl))) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Create new tags if provided
  const createdTagIds: string[] = [];
  if (newTags?.length) {
    for (const name of newTags) {
      const tag = await prisma.tag.upsert({
        where: { userId_name: { userId: session.user.id, name } },
        create: { userId: session.user.id, name, isCustom: true },
        update: {},
      });
      createdTagIds.push(tag.id);
    }
  }

  // Create new mistakes if provided
  const createdMistakeIds: string[] = [];
  if (newMistakes?.length) {
    for (const name of newMistakes) {
      const mistake = await prisma.mistake.upsert({
        where: { userId_name: { userId: session.user.id, name } },
        create: { userId: session.user.id, name, isCustom: true },
        update: {},
      });
      createdMistakeIds.push(mistake.id);
    }
  }

  const allTagIds = [...(tagIds ?? []), ...createdTagIds];
  const allMistakeIds = [...(mistakeIds ?? []), ...createdMistakeIds];

  const trade = await prisma.trade.create({
    data: {
      userId: session.user.id,
      asset,
      direction,
      date: new Date(date),
      pnl: parseFloat(pnl),
      rr: rr != null && !isNaN(Number(rr)) ? parseFloat(rr) : null,
      sessionId: sessionId || null,
      rating: rating ?? null,
      letterRating: letterRating ?? null,
      notes: notes ?? null,
      psychologyBefore: psychologyBefore ?? null,
      psychologyAfter: psychologyAfter ?? null,
      tradeTags: allTagIds.length
        ? { create: allTagIds.map((tagId: string) => ({ tagId })) }
        : undefined,
      tradeMistakes: allMistakeIds.length
        ? { create: allMistakeIds.map((mistakeId: string) => ({ mistakeId })) }
        : undefined,
    },
    include: {
      tradeTags: { include: { tag: true } },
      tradeMistakes: { include: { mistake: true } },
      screenshots: true,
      session: true,
    },
  });

  // Update user balance
  await prisma.user.update({
    where: { id: session.user.id },
    data: { currentBalance: { increment: Number(pnl) } },
  });

  return NextResponse.json(trade, { status: 201 });
}
