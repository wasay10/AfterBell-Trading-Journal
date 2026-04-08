import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CONFLUENCES } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let confluences = await prisma.confluence.findMany({
    where: { userId: session.user.id },
    orderBy: [{ priority: "asc" }, { name: "asc" }],
  });

  // Auto-seed defaults for users who registered before seeding was added
  if (confluences.length === 0) {
    await prisma.confluence.createMany({
      data: DEFAULT_CONFLUENCES.map((c) => ({
        userId: session.user.id,
        name: c.name,
        priority: c.priority as "HIGH" | "MEDIUM" | "LOW",
      })),
      skipDuplicates: true,
    });
    confluences = await prisma.confluence.findMany({
      where: { userId: session.user.id },
      orderBy: [{ priority: "asc" }, { name: "asc" }],
    });
  }

  return NextResponse.json(confluences);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, priority } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (!["HIGH", "MEDIUM", "LOW"].includes(priority)) {
    return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
  }

  try {
    const confluence = await prisma.confluence.create({
      data: { userId: session.user.id, name: name.trim(), priority },
    });
    return NextResponse.json(confluence, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Confluence with this name already exists" }, { status: 409 });
  }
}
