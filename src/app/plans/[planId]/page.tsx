import { notFound } from "next/navigation";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PlanItemsClient } from "@/features/plans/plan-items-client";
import { AIRecommendationsClient } from "@/features/ai/recommendations-client";
import Link from "next/link";

type Params = { params: Promise<{ planId: string }> };

export default async function PlanPage({ params }: Params) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) redirect("/signin");

  const { planId } = await params;
  const plan = await prisma.plan.findFirst({
    where: { id: planId, userId },
    select: {
      id: true,
      title: true,
      goal: true,
      status: true,
      createdAt: true,
      items: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          order: true,
          status: true,
        },
      },
    },
  });

  if (!plan) notFound();

  const initialItems = plan.items.map((i) => ({
    ...i,
    dueDate: i.dueDate ? i.dueDate.toISOString() : null,
  }));

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{plan.title}</h1>
            <p className="text-sm text-neutral-600">
              {plan.status} • Created {new Date(plan.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Link
            className="rounded-md border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
            href="/dashboard"
          >
            Back to dashboard
          </Link>
        </div>
        {plan.goal ? <p className="text-sm text-neutral-700">{plan.goal}</p> : null}
      </header>

      <PlanItemsClient planId={plan.id} initialItems={initialItems} />

      <AIRecommendationsClient planId={plan.id} />
    </main>
  );
}
