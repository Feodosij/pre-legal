"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./useAuth";

/**
 * This is a static export with no server-side middleware, so gating a page
 * behind auth can only happen client-side after the initial render.
 */
export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && !auth.user) {
      router.push("/");
    }
  }, [auth.isLoading, auth.user, router]);

  return auth;
}
