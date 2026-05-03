import { NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { sessionUpdateSchema } from "@/features/sessions/schemas";

type Params = { params: Promise<{ sessionId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return jsonError("Unauthorized", 401);
  const { sessionId } = await params;

  const existing = await prisma.studySession.findUnique({
    where: { id: sessionId },
    select: { id: true, userId: true },
  });
  if (!existing || existing.userId !== session.user.id) return jsonError("Not found", 404);

  const body = await req.json().catch(() => null);
  const parsed = sessionUpdateSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payload", 400, { issues: parsed.error.issues });

  const updated = await prisma.studySession.update({
    where: { id: sessionId },
    data: {
      endedAt:
        parsed.data.endedAt === undefined
          ? undefined
          : parsed.data.endedAt
            ? new Date(parsed.data.endedAt)
            : null,
      notes: parsed.data.notes === undefined ? undefined : parsed.data.notes,
      topic: parsed.data.topic === undefined ? undefined : parsed.data.topic,
    },
    select: { id: true, startedAt: true, endedAt: true, topic: true, notes: true },
  });

  return NextResponse.json({ session: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return jsonError("Unauthorized", 401);
  const { sessionId } = await params;

  const existing = await prisma.studySession.findUnique({
    where: { id: sessionId },
    select: { id: true, userId: true },
  });
  if (!existing || existing.userId !== session.user.id) return jsonError("Not found", 404);

  await prisma.studySession.delete({ where: { id: sessionId } });
  return NextResponse.json({ ok: true });
}
