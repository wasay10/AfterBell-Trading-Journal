import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mistakes = await prisma.mistake.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isCustom: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(mistakes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const mistake = await prisma.mistake.upsert({
    where: { userId_name: { userId: session.user.id, name } },
    create: { userId: session.user.id, name, isCustom: true },
    update: {},
  });

  return NextResponse.json(mistake);
}
