"use client";

import { useEffect, useMemo, useState } from "react";

type StudySession = {
  id: string;
  topic: string | null;
  notes: string | null;
  startedAt: string;
  endedAt: string | null;
};

function minutesBetween(startedAt: string, endedAt: string | null) {
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const start = new Date(startedAt).getTime();
  return Math.max(0, Math.round((end - start) / 60000));
}

export function SessionWidget() {
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/sessions");
      if (!res.ok) return;
      const data = (await res.json()) as { sessions: Array<StudySession> };
      if (cancelled) return;
      setSessions(
        data.sessions.map((s) => ({
          ...s,
          startedAt: new Date(s.startedAt).toISOString(),
          endedAt: s.endedAt ? new Date(s.endedAt).toISOString() : null,
        })),
      );
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function load() {
    const res = await fetch("/api/sessions");
    if (!res.ok) return;
    const data = (await res.json()) as { sessions: Array<StudySession> };
    setSessions(
      data.sessions.map((s) => ({
        ...s,
        startedAt: new Date(s.startedAt).toISOString(),
        endedAt: s.endedAt ? new Date(s.endedAt).toISOString() : null,
      })),
    );
  }

  const active = sessions.find((s) => !s.endedAt) ?? null;
  const totalRecentMinutes = useMemo(() => {
    const ended = sessions.filter((s) => !!s.endedAt);
    return ended.reduce((sum, s) => sum + minutesBetween(s.startedAt, s.endedAt), 0);
  }, [sessions]);

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">Study sessions</h2>
          <p className="text-xs text-neutral-500">
            {active ? "Active session running" : "No active session"} • Recent total{" "}
            {totalRecentMinutes} min
          </p>
        </div>
        <button
          className="rounded-md border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
          type="button"
          onClick={() => void load()}
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          className="w-full flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:opacity-60"
          placeholder="Topic (optional) e.g., System design"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={!!active}
        />
        <button
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          type="button"
          disabled={busy}
          onClick={async () => {
            setError(null);
            setBusy(true);
            try {
              if (!active) {
                const res = await fetch("/api/sessions", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ topic: topic || undefined }),
                });
                if (!res.ok) {
                  const data = (await res.json().catch(() => null)) as { error?: string } | null;
                  setError(data?.error ?? "Failed to start session.");
                  return;
                }
                setTopic("");
                await load();
                return;
              }

              const res = await fetch(`/api/sessions/${active.id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ endedAt: new Date().toISOString() }),
              });
              if (!res.ok) {
                const data = (await res.json().catch(() => null)) as { error?: string } | null;
                setError(data?.error ?? "Failed to stop session.");
                return;
              }
              await load();
            } finally {
              setBusy(false);
            }
          }}
        >
          {active ? (busy ? "Stopping..." : "Stop session") : busy ? "Starting..." : "Start session"}
        </button>
      </div>

      {error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="mt-4 space-y-2">
        {sessions.length === 0 ? (
          <p className="text-sm text-neutral-600">No sessions yet.</p>
        ) : (
          sessions.slice(0, 8).map((s) => (
            <div
              key={s.id}
              className="flex flex-col gap-1 rounded-lg border border-neutral-200 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{s.topic || "Untitled session"}</p>
                <p className="text-xs text-neutral-500">
                  {new Date(s.startedAt).toLocaleString()}{" "}
                  {s.endedAt ? `• ${minutesBetween(s.startedAt, s.endedAt)} min` : "• running"}
                </p>
              </div>
              {s.endedAt ? (
                <button
                  className="self-start rounded-md border border-neutral-200 px-2 py-1 text-sm hover:bg-neutral-50 sm:self-auto"
                  type="button"
                  onClick={async () => {
                    const prev = sessions;
                    setSessions((list) => list.filter((x) => x.id !== s.id));
                    const res = await fetch(`/api/sessions/${s.id}`, { method: "DELETE" });
                    if (!res.ok) setSessions(prev);
                  }}
                >
                  Delete
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
