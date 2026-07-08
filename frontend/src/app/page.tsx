"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && user) {
      router.push("/app/");
    }
  }, [isAuthLoading, user, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      router.push("/app/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-[#032147]">Prelegal</h1>
        <p className="mb-6 text-sm text-[#888888]">
          Draft legal agreements from ready-made templates.
        </p>

        <div className="mb-6 flex rounded-md border border-slate-200 p-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(null);
            }}
            className={`flex-1 rounded px-3 py-1.5 transition-colors ${
              mode === "signin"
                ? "bg-[#209dd7] text-white"
                : "text-[#888888] hover:bg-slate-50"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`flex-1 rounded px-3 py-1.5 transition-colors ${
              mode === "signup"
                ? "bg-[#209dd7] text-white"
                : "text-[#888888] hover:bg-slate-50"
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-[#032147]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#209dd7] focus:outline-none focus:ring-1 focus:ring-[#209dd7]"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-[#032147]">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#209dd7] focus:outline-none focus:ring-1 focus:ring-[#209dd7]"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            data-testid="submit-button"
            disabled={isSubmitting}
            className="w-full rounded-md bg-[#753991] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting
              ? "Please wait..."
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
