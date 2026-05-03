"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="text-sm text-neutral-600">
          Start tracking plans, sessions, and progress in minutes.
        </p>
      </header>

      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setBusy(true);
          try {
            const res = await fetch("/api/auth/signup", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ name: name || undefined, email, password }),
            });

            if (!res.ok) {
              const data = (await res.json().catch(() => null)) as { error?: string } | null;
              setError(data?.error ?? "Signup failed.");
              return;
            }

            const login = await signIn("credentials", {
              email,
              password,
              redirect: false,
              callbackUrl: "/dashboard",
            });

            router.push(login?.url ?? "/dashboard");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium">Name (optional)</span>
          <input
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-neutral-900"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Email</span>
          <input
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-neutral-900"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Password</span>
          <input
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-neutral-900"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <span className="text-xs text-neutral-500">Min 8 characters.</span>
        </label>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <button
          className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          type="submit"
          disabled={busy}
        >
          {busy ? "Creating..." : "Create account"}
        </button>

        <p className="text-sm text-neutral-600">
          Already have an account?{" "}
          <Link className="underline underline-offset-4" href="/signin">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
