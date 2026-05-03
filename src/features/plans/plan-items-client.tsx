"use client";

import { useMemo, useState } from "react";

type Item = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  order: number;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";
};

export function PlanItemsClient({
  planId,
  initialItems,
}: {
  planId: string;
  initialItems: Item[];
}) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const out = { TODO: 0, IN_PROGRESS: 0, DONE: 0, BLOCKED: 0 };
    for (const i of items) out[i.status] += 1;
    return out;
  }, [items]);

  async function refresh() {
    const res = await fetch(`/api/plans/${planId}/items`);
    const data = (await res.json()) as { items: Item[] };
    setItems(data.items);
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">Plan items</h2>
          <p className="text-xs text-neutral-500">
            TODO {counts.TODO} • IN_PROGRESS {counts.IN_PROGRESS} • DONE {counts.DONE} • BLOCKED{" "}
            {counts.BLOCKED}
          </p>
        </div>
        <button
          className="rounded-md border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
          type="button"
          onClick={() => void refresh()}
        >
          Refresh
        </button>
      </div>

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setBusy(true);
          try {
            const res = await fetch(`/api/plans/${planId}/items`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ title: newTitle }),
            });
            const data = (await res.json().catch(() => null)) as
              | { item?: Item; error?: string }
              | null;
            if (!res.ok || !data?.item) {
              setError(data?.error ?? "Failed to add item.");
              return;
            }
            setItems((prev) => [...prev, data.item!].sort((a, b) => a.order - b.order));
            setNewTitle("");
          } finally {
            setBusy(false);
          }
        }}
      >
        <input
          className="w-full flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-neutral-900"
          placeholder="Add an item (e.g., Finish arrays practice)"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          required
        />
        <button
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          type="submit"
          disabled={busy}
        >
          {busy ? "Adding..." : "Add"}
        </button>
      </form>

      {error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-neutral-600">No items yet.</p>
        ) : (
          items.map((i) => (
            <div
              key={i.id}
              className="flex flex-col gap-2 rounded-lg border border-neutral-200 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{i.title}</p>
                <p className="text-xs text-neutral-500">{i.status}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="rounded-md border border-neutral-200 px-2 py-1 text-sm"
                  value={i.status}
                  onChange={async (e) => {
                    const next = e.target.value as Item["status"];
                    setItems((prev) => prev.map((x) => (x.id === i.id ? { ...x, status: next } : x)));
                    const res = await fetch(`/api/items/${i.id}`, {
                      method: "PATCH",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ status: next }),
                    });
                    if (!res.ok) void refresh();
                  }}
                >
                  <option value="TODO">TODO</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="DONE">DONE</option>
                  <option value="BLOCKED">BLOCKED</option>
                </select>
                <button
                  className="rounded-md border border-neutral-200 px-2 py-1 text-sm hover:bg-neutral-50"
                  type="button"
                  onClick={async () => {
                    const prev = items;
                    setItems((s) => s.filter((x) => x.id !== i.id));
                    const res = await fetch(`/api/items/${i.id}`, { method: "DELETE" });
                    if (!res.ok) setItems(prev);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

