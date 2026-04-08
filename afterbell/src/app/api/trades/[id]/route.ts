import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CONFLUENCE_POINTS, computeGradeFromScore } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const trade = await prisma.trade.findFirst({
    where: { id, userId: session.user.id },
    include: {
      tradeTags: { include: { tag: true } },
      tradeMistakes: { include: { mistake: true } },
      tradeConfluences: { include: { confluence: true } },
      screenshots: { orderBy: { order: "asc" } },
      session: true,
    },
  });

  if (!trade) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(trade);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.trade.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const {
    asset, direction, date, pnl, rr,
    entryTime, drawOnLiquidity, newsDriver,
    sessionId, rating, letterRating,
    notes, psychologyBefore, psychologyAfter,
    tagIds, mistakeIds, confluenceIds, screenshotUrls,
  } = body;

  // Delete existing relations then recreate
  await prisma.tradeTag.deleteMany({ where: { tradeId: id } });
  await prisma.tradeMistake.deleteMany({ where: { tradeId: id } });
  await prisma.tradeConfluence.deleteMany({ where: { tradeId: id } });
  if (screenshotUrls?.length) {
    await prisma.screenshot.deleteMany({ where: { tradeId: id } });
  }

  // Auto-grade from confluences
  let computedGrade: string | null = null;
  if (confluenceIds?.length) {
    const cfls = await prisma.confluence.findMany({
      where: { id: { in: confluenceIds }, userId: session.user.id },
    });
    const score = cfls.reduce((sum, c) => sum + (CONFLUENCE_POINTS[c.priority] ?? 0), 0);
    computedGrade = computeGradeFromScore(score);
  }

  const trade = await prisma.trade.update({
    where: { id },
    data: {
      asset,
      direction,
      date: new Date(date),
      pnl: Number(pnl),
      rr: rr != null && !isNaN(Number(rr)) ? Number(rr) : null,
      entryTime: entryTime || null,
      drawOnLiquidity: drawOnLiquidity || null,
      newsDriver: newsDriver || null,
      sessionId: sessionId || null,
      rating: confluenceIds?.length ? null : (rating ?? null),
      letterRating: computedGrade ?? (letterRating || null),
      notes: notes ?? null,
      psychologyBefore: psychologyBefore ?? null,
      psychologyAfter: psychologyAfter ?? null,
      tradeTags: (tagIds ?? []).length
        ? { create: (tagIds ?? []).map((tagId: string) => ({ tagId })) }
        : undefined,
      tradeMistakes: (mistakeIds ?? []).length
        ? { create: (mistakeIds ?? []).map((mistakeId: string) => ({ mistakeId })) }
        : undefined,
      tradeConfluences: (confluenceIds ?? []).length
        ? { create: (confluenceIds as string[]).map((confluenceId: string) => ({ confluenceId })) }
        : undefined,
      screenshots: screenshotUrls?.length
        ? { create: (screenshotUrls as string[]).map((url: string, order: number) => ({ url, order })) }
        : undefined,
    },
    include: {
      tradeTags: { include: { tag: true } },
      tradeMistakes: { include: { mistake: true } },
      tradeConfluences: { include: { confluence: true } },
      screenshots: true,
      session: true,
    },
  });

  const pnlDiff = Number(pnl) - existing.pnl;
  if (pnlDiff !== 0) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { currentBalance: { increment: pnlDiff } },
    });
  }

  return NextResponse.json(trade);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.trade.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.trade.delete({ where: { id } });
  await prisma.user.update({
    where: { id: session.user.id },
    data: { currentBalance: { decrement: existing.pnl } },
  });

  return NextResponse.json({ ok: true });
}
