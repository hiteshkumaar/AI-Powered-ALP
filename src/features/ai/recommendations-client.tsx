"use client";

import { useState } from "react";

type Recommendation = { title: string; content: string };

export function AIRecommendationsClient({ planId }: { planId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Recommendation[]>([]);

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">AI recommendations</h2>
          <p className="text-xs text-neutral-500">
            Generates actionable next steps based on your plan and sessions.
          </p>
        </div>
        <button
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          type="button"
          disabled={busy}
          onClick={async () => {
            setError(null);
            setBusy(true);
            try {
              const res = await fetch("/api/ai/recommendations", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ planId }),
              });
              const data = (await res.json().catch(() => null)) as
                | { recommendations?: Recommendation[]; error?: string }
                | null;
              if (!res.ok || !data?.recommendations) {
                setError(data?.error ?? "Failed to generate recommendations.");
                return;
              }
              setItems(data.recommendations);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Generating..." : "Generate"}
        </button>
      </div>

      {error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-neutral-600">No recommendations yet.</p>
        ) : (
          items.map((r, idx) => (
            <div key={idx} className="rounded-lg border border-neutral-200 px-3 py-3">
              <p className="text-sm font-semibold">{r.title}</p>
              <p className="mt-1 text-sm text-neutral-700">{r.content}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

