import { Suspense } from "react";

import { SignInForm } from "@/features/auth/signin-form";

export default function SignInPage() {
  return (
    <Suspense
      fallback={<div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-4">Loading…</div>}
    >
      <SignInForm />
    </Suspense>
  );
}

