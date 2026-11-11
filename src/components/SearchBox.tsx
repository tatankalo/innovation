"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export default function SearchBox({ size = "lg", autoFocus = false }: { size?: "lg" | "md"; autoFocus?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(params.toString());
    if (q.trim()) next.set("q", q.trim());
    else next.delete("q");
    next.delete("p");
    start(() => router.push(`/?${next.toString()}`));
  }

  const lg = size === "lg";
  return (
    <form onSubmit={submit} role="search" className="relative w-full">
      <label htmlFor="q" className="sr-only">Search university technology</label>
      <input
        id="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus={autoFocus}
        placeholder="Try “cheaper water desalination for farms”"
        className={`w-full bg-surface border border-rule rounded-[6px] text-ink placeholder:text-ink-3 outline-none focus:border-ink focus:shadow-[0_0_0_4px_var(--accent-wash)] ${
          lg ? "h-16 pl-6 pr-36 text-[20px]" : "h-12 pl-4 pr-28 text-[16px]"
        }`}
      />
      <button
        type="submit"
        className={`absolute top-1/2 -translate-y-1/2 right-2 bg-ink text-paper rounded-[4px] font-medium hover:bg-accent ${
          lg ? "h-12 px-6 text-[15px]" : "h-9 px-4 text-[14px]"
        }`}
      >
        {pending ? "Searching" : "Search"}
      </button>
    </form>
  );
}
