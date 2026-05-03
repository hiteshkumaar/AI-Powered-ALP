import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

const requestSchema = z.object({
  planId: z.string().min(1),
});

const aiResponseSchema = z.object({
  recommendations: z
    .array(
      z.object({
        title: z.string().min(1).max(140),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(6),
});

async function generateWithGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing in .env");
    return null;
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${prompt}\n\nIMPORTANT: Return ONLY a valid JSON object. No markdown, no backticks. Schema: {"recommendations":[{"title": "string", "content": "string"}]}`,
                },
              ],
            },
          ],
        }),
      },
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("Gemini API error:", res.status, errorData);
      return null;
    }

    const data = await res.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof text !== "string") return null;

    // Clean up markdown if present
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsedJson = JSON.parse(text);
    const parsed = aiResponseSchema.safeParse(parsedJson);

    if (!parsed.success) {
      console.error("AI Response Schema mismatch:", parsed.error.format());
      return null;
    }

    return parsed.data.recommendations;
  } catch (error) {
    console.error("Failed to generate recommendations with Gemini:", error);
    return null;
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  const url = new URL(req.url);
  const planId = url.searchParams.get("planId");

  const recs = await prisma.recommendation.findMany({
    where: { userId: session.user.id, planId: planId ?? undefined },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, planId: true, title: true, content: true, createdAt: true },
  });

  return NextResponse.json({ recommendations: recs });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  const limit = rateLimit({ key: `ai:${session.user.id}`, capacity: 5, refillPerMinute: 1 });
  if (!limit.ok) return jsonError("Rate limit exceeded", 429);

  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payload", 400, { issues: parsed.error.issues });

  const plan = await prisma.plan.findFirst({
    where: { id: parsed.data.planId, userId: session.user.id },
    select: {
      id: true,
      title: true,
      goal: true,
      status: true,
      items: { orderBy: [{ order: "asc" }], select: { title: true, status: true } },
    },
  });
  if (!plan) return jsonError("Plan not found", 404);

  const recentSessions = await prisma.studySession.findMany({
    where: { userId: session.user.id, planId: plan.id },
    orderBy: { startedAt: "desc" },
    take: 10,
    select: { topic: true, startedAt: true, endedAt: true },
  });

  const prompt = [
    "You are an expert learning coach. Return ONLY valid JSON.",
    'Schema: {"recommendations":[{"title":string,"content":string}]}',
    "Write 3 actionable recommendations to improve the user's plan execution this week.",
    "Constraints: be concrete, avoid generic advice, include timeboxing and prioritization. No markdown.",
    "",
    `Plan title: ${plan.title}`,
    plan.goal ? `Goal: ${plan.goal}` : "Goal: (none provided)",
    `Status: ${plan.status}`,
    "Items:",
    ...plan.items.slice(0, 25).map((i, idx) => `  ${idx + 1}. [${i.status}] ${i.title}`),
    "Recent sessions:",
    ...recentSessions.map((s, idx) => {
      const end = s.endedAt ? s.endedAt.toISOString() : "running";
      return `  ${idx + 1}. ${s.topic ?? "Untitled"} (${s.startedAt.toISOString()} - ${end})`;
    }),
  ].join("\n");

  const generated =
    (await generateWithGemini(prompt)) ??
    [
      {
        title: "Pick 1–2 high-impact items for today",
        content:
          "Choose your top 1–2 TODO items that unblock everything else. Timebox 45 minutes each, and move the rest to later. End with 5 minutes of review.",
      },
      {
        title: "Convert vague tasks into next actions",
        content:
          "For any item that feels large, rewrite it into a single next action you can finish in <30 minutes. Add 2–3 follow-ups only after the next action is done.",
      },
      {
        title: "Use a weekly cadence + progress check",
        content:
          "Schedule 3 fixed study sessions (e.g., Mon/Wed/Fri). After each session, mark one item DONE and write a 2-sentence reflection on what blocked you.",
      },
    ];

  const saved = await prisma.recommendation.createMany({
    data: generated.map((r) => ({
      userId: session.user.id,
      planId: plan.id,
      title: r.title,
      content: r.content,
    })),
  });

  return NextResponse.json({ created: saved.count, recommendations: generated });
}
