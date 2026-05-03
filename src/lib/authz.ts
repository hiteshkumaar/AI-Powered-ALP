import { getSession } from "@/lib/session";

export async function requireUser() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireRole(allowed: Array<"USER" | "ADMIN">) {
  const session = await requireUser();
  if (!allowed.includes(session.user.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
