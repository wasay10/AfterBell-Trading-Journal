import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MISTAKES, DEFAULT_SESSIONS, DEFAULT_CONFLUENCES } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const { email, password, displayName } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: displayName || email.split("@")[0],
    },
  });

  // Seed default mistakes
  await prisma.mistake.createMany({
    data: DEFAULT_MISTAKES.map((name) => ({
      userId: user.id,
      name,
      isCustom: false,
    })),
  });

  // Seed default sessions
  await prisma.tradingSession.createMany({
    data: DEFAULT_SESSIONS.map((s) => ({
      userId: user.id,
      ...s,
    })),
  });

  // Seed default confluences
  await prisma.confluence.createMany({
    data: DEFAULT_CONFLUENCES.map((c) => ({
      userId: user.id,
      name: c.name,
      priority: c.priority as "HIGH" | "MEDIUM" | "LOW",
    })),
  });

  return NextResponse.json({ ok: true });
}
