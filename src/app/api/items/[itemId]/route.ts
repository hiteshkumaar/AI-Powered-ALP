import { NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { planItemUpdateSchema } from "@/features/plans/schemas";

type Params = { params: Promise<{ itemId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return jsonError("Unauthorized", 401);
  const { itemId } = await params;

  const item = await prisma.planItem.findUnique({
    where: { id: itemId },
    select: { id: true, planId: true, plan: { select: { userId: true } } },
  });
  if (!item || item.plan.userId !== session.user.id) return jsonError("Not found", 404);

  const body = await req.json().catch(() => null);
  const parsed = planItemUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid payload", 400, { issues: parsed.error.issues });
  }

  const updated = await prisma.planItem.update({
    where: { id: itemId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description === undefined ? undefined : parsed.data.description,
      dueDate:
        parsed.data.dueDate === undefined
          ? undefined
          : parsed.data.dueDate
            ? new Date(parsed.data.dueDate)
            : null,
      status: parsed.data.status,
      order: parsed.data.order,
    },
    select: { id: true, title: true, status: true, order: true, updatedAt: true },
  });

  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return jsonError("Unauthorized", 401);
  const { itemId } = await params;

  const item = await prisma.planItem.findUnique({
    where: { id: itemId },
    select: { id: true, plan: { select: { userId: true } } },
  });
  if (!item || item.plan.userId !== session.user.id) return jsonError("Not found", 404);

  await prisma.planItem.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true });
}
