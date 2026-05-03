"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      className="rounded-md border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
      onClick={() => void signOut({ callbackUrl: "/signin" })}
    >
      Sign out
    </button>
  );
}

