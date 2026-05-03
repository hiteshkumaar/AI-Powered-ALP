import { NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { planCreateSchema } from "@/features/plans/schemas";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  const plans = await prisma.plan.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      goal: true,
      status: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { items: true } },
    },
  });

  return NextResponse.json({ plans });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const parsed = planCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid payload", 400, { issues: parsed.error.issues });
  }

  const plan = await prisma.plan.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title,
      goal: parsed.data.goal,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
    },
    select: { id: true, title: true, status: true, createdAt: true },
  });

  return NextResponse.json({ plan }, { status: 201 });
}
