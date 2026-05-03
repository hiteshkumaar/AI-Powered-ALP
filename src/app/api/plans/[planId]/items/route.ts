import { NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { planItemCreateSchema } from "@/features/plans/schemas";

type Params = { params: Promise<{ planId: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return jsonError("Unauthorized", 401);
  const { planId } = await params;

  const plan = await prisma.plan.findFirst({
    where: { id: planId, userId: session.user.id },
    select: { id: true },
  });
  if (!plan) return jsonError("Plan not found", 404);

  const body = await req.json().catch(() => null);
  const parsed = planItemCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid payload", 400, { issues: parsed.error.issues });
  }

  const maxOrder = await prisma.planItem.aggregate({
    where: { planId },
    _max: { order: true },
  });

  const item = await prisma.planItem.create({
    data: {
      planId,
      title: parsed.data.title,
      description: parsed.data.description,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      order: (maxOrder._max.order ?? -1) + 1,
    },
    select: { id: true, title: true, status: true, order: true, createdAt: true },
  });

  return NextResponse.json({ item }, { status: 201 });
}

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return jsonError("Unauthorized", 401);
  const { planId } = await params;

  const plan = await prisma.plan.findFirst({
    where: { id: planId, userId: session.user.id },
    select: { id: true },
  });
  if (!plan) return jsonError("Plan not found", 404);

  const items = await prisma.planItem.findMany({
    where: { planId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ items });
}
