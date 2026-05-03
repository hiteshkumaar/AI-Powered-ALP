"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewPlanForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="glass relative mx-auto w-full space-y-8 rounded-3xl p-8 sm:p-10"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setBusy(true);
        try {
          const res = await fetch("/api/plans", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ title, goal: goal || undefined }),
          });
          const data = (await res.json().catch(() => null)) as
            | { plan?: { id: string }; error?: string }
            | null;
          if (!res.ok || !data?.plan?.id) {
            setError(data?.error ?? "Failed to create plan.");
            return;
          }
          router.push(`/plans/${data.plan.id}`);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="space-y-6">
        <div className="group space-y-2">
          <label className="block text-xs font-bold uppercase tracking-[0.15em] text-slate-400 transition-colors group-focus-within:text-accent" htmlFor="title">
            Plan Title
          </label>
          <input
            id="title"
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base text-slate-900 shadow-sm transition-all placeholder:text-slate-300 outline-none focus:border-accent focus:ring-4 focus:ring-accent/5"
            placeholder="e.g. 30-Day Language Immersion"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="group space-y-2">
          <label className="block text-xs font-bold uppercase tracking-[0.15em] text-slate-400 transition-colors group-focus-within:text-accent" htmlFor="goal">
            The Ultimate Goal
          </label>
          <textarea
            id="goal"
            className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base text-slate-900 shadow-sm transition-all placeholder:text-slate-300 outline-none focus:border-accent focus:ring-4 focus:ring-accent/5"
            placeholder="What does success look like for this plan?"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="animate-in fade-in slide-in-from-top-2 rounded-2xl border border-red-100 bg-red-50/50 p-4 text-sm font-medium text-red-600">
          <span className="mr-2">⚠️</span> {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="submit"
          className="flex-[2] rounded-2xl bg-gradient-to-r from-accent to-accent-secondary px-8 py-4.5 text-base font-bold text-white shadow-xl shadow-indigo-200/50 transition-all hover:translate-y-[-2px] hover:shadow-indigo-300/50 disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
          disabled={busy}
        >
          {busy ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating...
            </span>
          ) : (
            "Generate AI Plan"
          )}
        </button>
        <button
          type="button"
          className="flex-1 rounded-2xl border border-slate-200 bg-white px-8 py-4.5 text-base font-semibold text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 active:scale-[0.98]"
          onClick={() => router.push("/dashboard")}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

