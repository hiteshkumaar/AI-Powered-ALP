import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";

export function getSession() {
  return getServerSession(authOptions);
}

