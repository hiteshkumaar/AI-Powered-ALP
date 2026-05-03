import { NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { planUpdateSchema } from "@/features/plans/schemas";

type Params = { params: Promise<{ planId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return jsonError("Unauthorized", 401);
  const { planId } = await params;

  const plan = await prisma.plan.findFirst({
    where: { id: planId, userId: session.user.id },
    select: {
      id: true,
      title: true,
      goal: true,
      status: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      updatedAt: true,
      items: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          order: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!plan) return jsonError("Not found", 404);
  return NextResponse.json({ plan });
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return jsonError("Unauthorized", 401);
  const { planId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = planUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid payload", 400, { issues: parsed.error.issues });
  }

  const exists = await prisma.plan.findFirst({
    where: { id: planId, userId: session.user.id },
    select: { id: true },
  });
  if (!exists) return jsonError("Not found", 404);

  const plan = await prisma.plan.update({
    where: { id: planId },
    data: {
      title: parsed.data.title,
      goal: parsed.data.goal === undefined ? undefined : parsed.data.goal,
      status: parsed.data.status,
      startDate:
        parsed.data.startDate === undefined
          ? undefined
          : parsed.data.startDate
            ? new Date(parsed.data.startDate)
            : null,
      endDate:
        parsed.data.endDate === undefined
          ? undefined
          : parsed.data.endDate
            ? new Date(parsed.data.endDate)
            : null,
    },
    select: { id: true, title: true, status: true, updatedAt: true },
  });

  return NextResponse.json({ plan });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return jsonError("Unauthorized", 401);
  const { planId } = await params;

  const exists = await prisma.plan.findFirst({
    where: { id: planId, userId: session.user.id },
    select: { id: true },
  });
  if (!exists) return jsonError("Not found", 404);

  await prisma.plan.delete({ where: { id: planId } });
  return NextResponse.json({ ok: true });
}
