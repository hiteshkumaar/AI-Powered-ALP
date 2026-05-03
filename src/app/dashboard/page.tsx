import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { SignOutButton } from "@/components/sign-out-button";
import { SessionWidget } from "@/features/sessions/session-widget";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) redirect("/signin?callbackUrl=/dashboard");

  const plans = userId
    ? await prisma.plan.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, status: true, createdAt: true },
      })
    : [];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-12 px-6 py-16">
      <header className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-gradient text-4xl font-extrabold tracking-tight">Your Dashboard</h1>
          <p className="text-lg text-slate-500">
            Track your progress and manage your AI learning paths.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            className="rounded-2xl bg-gradient-to-r from-accent to-accent-secondary px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-indigo-200 transition-all hover:translate-y-[-2px] hover:shadow-indigo-300 active:translate-y-0"
            href="/plans/new"
          >
            + New Learning Plan
          </Link>
          <SignOutButton />
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-12">
        <section className="glass rounded-3xl p-8 lg:col-span-8">
          <div className="flex items-center justify-between pb-8">
            <h2 className="text-xl font-bold text-slate-800">Active Plans</h2>
            <Link className="text-sm font-bold text-accent transition-colors hover:text-accent-secondary" href="/plans">
              View All Paths →
            </Link>
          </div>
          <div className="space-y-4">
            {plans.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
                <div className="rounded-full bg-slate-100 p-4">
                  <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="mt-4 text-base font-medium text-slate-500">No active paths found.</p>
                <Link href="/plans/new" className="mt-3 text-sm font-bold text-accent hover:underline">
                  Start your first journey
                </Link>
              </div>
            ) : (
              plans.map((p) => (
                <div
                  key={p.id}
                  className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white/50 p-5 transition-all hover:border-accent/20 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-slate-800 group-hover:text-accent transition-colors">{p.title}</p>
                    <div className="flex items-center gap-3 pt-1">
                      <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                        {p.status}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <Link 
                    className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-accent hover:shadow-lg hover:shadow-accent/30" 
                    href={`/plans/${p.id}`}
                  >
                    Continue
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>

        <aside className="lg:col-span-4">
          <SessionWidget />
        </aside>
      </div>
    </main>
  );
}
