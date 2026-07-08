"use client";

import { useRouter } from "next/navigation";

interface HeaderProps {
  userEmail: string;
  onSignOut: () => void;
  active: "creator" | "history";
}

export default function Header({ userEmail, onSignOut, active }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-8">
        <span className="text-lg font-bold text-[#032147]">Prelegal</span>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => router.push("/app/")}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              active === "creator"
                ? "bg-[#209dd7]/10 text-[#209dd7]"
                : "text-[#888888] hover:bg-slate-50"
            }`}
          >
            Document Creator
          </button>
          <button
            type="button"
            onClick={() => router.push("/app/history/")}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              active === "history"
                ? "bg-[#209dd7]/10 text-[#209dd7]"
                : "text-[#888888] hover:bg-slate-50"
            }`}
          >
            History
          </button>
        </nav>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-[#888888]">{userEmail}</span>
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-[#032147] hover:bg-slate-50"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
