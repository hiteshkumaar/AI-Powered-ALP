import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { NewPlanForm } from "@/features/plans/new-plan-form";

export default async function NewPlanPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/plans/new");

  return (
    <main className="relative flex min-h-[80vh] flex-col items-center justify-center px-4 py-20">
      <div className="w-full max-w-xl space-y-8">
        <header className="space-y-3 text-center">
          <h1 className="text-gradient text-4xl font-bold tracking-tight sm:text-5xl">
            Create your path
          </h1>
          <p className="mx-auto max-w-md text-base text-neutral-400">
            Define a clear goal and break it down into actionable milestones with AI assistance.
          </p>
        </header>

        <NewPlanForm />
      </div>
    </main>
  );
}
