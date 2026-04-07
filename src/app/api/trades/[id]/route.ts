import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const existing = await prisma.trade.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const {
    asset, direction, date, pnl, rr, sessionId,
    rating, letterRating, notes, psychologyBefore, psychologyAfter,
    tagIds, mistakeIds,
  } = body;

  // Delete existing relations then recreate
  await prisma.tradeTag.deleteMany({ where: { tradeId: id } });
  await prisma.tradeMistake.deleteMany({ where: { tradeId: id } });

  const trade = await prisma.trade.update({
    where: { id },
    data: {
      asset,
      direction,
      date: new Date(date),
      pnl: parseFloat(pnl),
      rr: rr ? parseFloat(rr) : null,
      sessionId: sessionId || null,
      rating: rating ?? null,
      letterRating: letterRating ?? null,
      notes: notes ?? null,
      psychologyBefore: psychologyBefore ?? null,
      psychologyAfter: psychologyAfter ?? null,
      tradeTags: (tagIds ?? []).length
        ? { create: (tagIds ?? []).map((tagId: string) => ({ tagId })) }
        : undefined,
      tradeMistakes: (mistakeIds ?? []).length
        ? { create: (mistakeIds ?? []).map((mistakeId: string) => ({ mistakeId })) }
        : undefined,
    },
    include: {
      tradeTags: { include: { tag: true } },
      tradeMistakes: { include: { mistake: true } },
      screenshots: true,
      session: true,
    },
  });

  // Recalculate balance
  const pnlDiff = parseFloat(pnl) - existing.pnl;
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

  const existing = await prisma.trade.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.trade.delete({ where: { id } });
  await prisma.user.update({
    where: { id: session.user.id },
    data: { currentBalance: { decrement: existing.pnl } },
  });

  return NextResponse.json({ ok: true });
}
