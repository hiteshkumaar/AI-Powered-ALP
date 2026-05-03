import { NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { sessionCreateSchema } from "@/features/sessions/schemas";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  const sessions = await prisma.studySession.findMany({
    where: { userId: session.user.id },
    orderBy: { startedAt: "desc" },
    take: 20,
    select: { id: true, planId: true, topic: true, notes: true, startedAt: true, endedAt: true },
  });

  return NextResponse.json({ sessions });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const parsed = sessionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid payload", 400, { issues: parsed.error.issues });
  }

  if (parsed.data.planId) {
    const plan = await prisma.plan.findFirst({
      where: { id: parsed.data.planId, userId: session.user.id },
      select: { id: true },
    });
    if (!plan) return jsonError("Plan not found", 404);
  }

  const created = await prisma.studySession.create({
    data: {
      userId: session.user.id,
      planId: parsed.data.planId,
      topic: parsed.data.topic,
      notes: parsed.data.notes,
      startedAt: parsed.data.startedAt ? new Date(parsed.data.startedAt) : new Date(),
    },
    select: { id: true, startedAt: true },
  });

  return NextResponse.json({ session: created }, { status: 201 });
}
