import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      displayName: true,
      startingBalance: true,
      currentBalance: true,
      breakevenCap: true,
      ratingStyle: true,
    },
  });

  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { displayName, startingBalance, breakevenCap, ratingStyle, newPassword, currentPassword } = body;

  const updateData: Record<string, unknown> = {};
  if (displayName !== undefined) updateData.displayName = displayName;
  if (startingBalance !== undefined) updateData.startingBalance = parseFloat(startingBalance);
  if (breakevenCap !== undefined) updateData.breakevenCap = parseFloat(breakevenCap);
  if (ratingStyle !== undefined) updateData.ratingStyle = ratingStyle;

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password required" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!user.passwordHash) return NextResponse.json({ error: "No password set (sign in with Google)" }, { status: 400 });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
    updateData.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: {
      id: true,
      email: true,
      displayName: true,
      startingBalance: true,
      currentBalance: true,
      breakevenCap: true,
      ratingStyle: true,
    },
  });

  return NextResponse.json(user);
}
