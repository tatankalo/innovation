"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { LENSES, PROGRAMS, PROGRAM_ORDER, SECTORS, num } from "@/lib/format";

type Facets = {
  programs: Record<string, number>;
  years: Record<string, number>;
  universities: { id: number; name: string; n: number }[];
  states: { st: string; n: number }[];
  lenses: { climate: number; agtech: number; tagged: number };
  sectors: Record<string, number>;
  subs: Record<string, number>;
};

export default function Filters({
  facets,
  universities,
}: {
  facets: Facets;
  universities: { id: number; name: string; state: string | null }[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const types = (params.get("t") ?? "").split(",").filter(Boolean);

  function set(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("p");
    start(() => router.push(`/?${next.toString()}`, { scroll: false }));
  }
  const lens = params.get("l");
  const sub = params.get("sub");
  function setLens(l: string) {
    const next = new URLSearchParams(params.toString());
    next.delete("sub");
    next.delete("p");
    if (lens === l) next.delete("l");
    else next.set("l", l);
    start(() => router.push(`/?${next.toString()}`, { scroll: false }));
  }
  function toggleType(t: string) {
    const s = new Set(types);
    if (s.has(t)) s.delete(t);
    else s.add(t);
    set("t", [...s].join(",") || null);
  }

  const years = Array.from({ length: 6 }, (_, i) => 2021 + i);
  const maxYear = Math.max(1, ...Object.values(facets.years ?? {}));
  const u = params.get("u");
  const selectCls =
    "w-full h-10 px-3 bg-surface border border-rule rounded-[2px] text-[14px] text-ink outline-none focus:border-ink";

  return (
    <aside className={`space-y-8 ${pending ? "opacity-60" : ""}`} aria-label="Filters">
      <div>
        <h3 className="label mb-3">Topic lens</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(LENSES).map(([k, v]) => {
            const on = lens === k;
            const n = facets.lenses?.[k as "climate" | "agtech"] ?? 0;
            return (
              <button
                key={k}
                onClick={() => setLens(k)}
                aria-pressed={on}
                className={`h-14 px-3 rounded-[2px] border text-left ${
                  on ? "border-accent bg-accent-wash" : "border-rule hover:border-ink-3"
                }`}
              >
                <span className={`block text-[14px] font-semibold ${on ? "text-accent" : "text-ink"}`}>{v.label}</span>
                <span className="block font-mono text-[12px] text-ink-3 tnum">{num(n)}</span>
              </button>
            );
          })}
        </div>
        {lens && LENSES[lens] && (
          <ul className="mt-3 space-y-0.5">
            {Object.entries(LENSES[lens].subs)
              .map(([k, label]) => ({ k, label, n: facets.subs?.[k] ?? 0 }))
              .filter((x) => x.n > 0 || x.k === sub)
              .sort((a, b) => b.n - a.n)
              .map((x) => (
                <li key={x.k}>
                  <button
                    onClick={() => set("sub", sub === x.k ? null : x.k)}
                    aria-pressed={sub === x.k}
                    className={`w-full flex justify-between gap-3 text-left text-[13px] py-1 px-2 rounded-[2px] ${
                      sub === x.k ? "bg-accent-wash text-ink font-semibold" : "text-ink-2 hover:text-ink"
                    }`}
                  >
                    <span className="truncate">{x.label}</span>
                    <span className="font-mono text-[12px] text-ink-3 tnum">{num(x.n)}</span>
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="label mb-3">Sector</h3>
        <select aria-label="Sector" className={selectCls} value={params.get("sec") ?? ""} onChange={(e) => set("sec", e.target.value || null)}>
          <option value="">All sectors</option>
          {Object.entries(SECTORS).map(([k, label]) => (
            <option key={k} value={k}>{label} ({num(facets.sectors?.[k] ?? 0)})</option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="label mb-3">Type</h3>
        <ul className="space-y-1">
          {PROGRAM_ORDER.map((p) => {
            const on = types.includes(p);
            const n = facets.programs?.[p] ?? 0;
            return (
              <li key={p}>
                <button
                  onClick={() => toggleType(p)}
                  aria-pressed={on}
                  className={`w-full flex items-center justify-between h-9 px-3 rounded-[2px] text-[14px] font-medium border ${
                    on ? "border-accent bg-accent-wash text-ink" : "border-transparent hover:border-rule text-ink-2"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-3.5 h-3.5 rounded-[2px] border grid place-items-center ${
                        on ? "bg-accent border-accent" : "border-ink-3"
                      }`}
                    >
                      {on && (
                        <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
                          <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" />
                        </svg>
                      )}
                    </span>
                    {PROGRAMS[p].label}
                  </span>
                  <span className="font-mono text-[12px] text-ink-3 tnum">{num(n)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h3 className="label mb-3">Year</h3>
        <div className="flex items-end gap-1.5 h-16 mb-3" aria-hidden>
          {years.map((y) => {
            const n = facets.years?.[y] ?? 0;
            const from = Number(params.get("yf") ?? 0);
            const to = Number(params.get("yt") ?? 9999);
            const active = y >= from && y <= to;
            return (
              <div key={y} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-[1px] ${active ? "bg-ink" : "bg-rule"}`}
                  style={{ height: `${Math.max(2, (n / maxYear) * 48)}px` }}
                  title={`${y}: ${n}`}
                />
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select aria-label="From year" className={selectCls} value={params.get("yf") ?? ""} onChange={(e) => set("yf", e.target.value || null)}>
            <option value="">From</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select aria-label="To year" className={selectCls} value={params.get("yt") ?? ""} onChange={(e) => set("yt", e.target.value || null)}>
            <option value="">To</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div>
        <h3 className="label mb-3">University</h3>
        <select aria-label="University" className={selectCls} value={u ?? ""} onChange={(e) => set("u", e.target.value || null)}>
          <option value="">All universities</option>
          {universities.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        {!u && facets.universities?.length > 0 && (
          <ul className="mt-3 space-y-1">
            {facets.universities.slice(0, 6).map((x) => (
              <li key={x.id}>
                <button onClick={() => set("u", String(x.id))} className="w-full flex justify-between gap-3 text-left text-[13px] text-ink-2 hover:text-ink py-0.5">
                  <span className="truncate">{x.name}</span>
                  <span className="font-mono text-[12px] text-ink-3 tnum">{num(x.n)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="label mb-3">State</h3>
        <select aria-label="State" className={selectCls} value={params.get("s") ?? ""} onChange={(e) => set("s", e.target.value || null)}>
          <option value="">All states</option>
          {[...(facets.states ?? [])].sort((a, b) => a.st.localeCompare(b.st)).map((x) => (
            <option key={x.st} value={x.st}>{x.st} ({num(x.n)})</option>
          ))}
          {params.get("s") && !(facets.states ?? []).some((x) => x.st === params.get("s")) && (
            <option value={params.get("s")!}>{params.get("s")}</option>
          )}
        </select>
      </div>

      {(types.length > 0 || u || lens || params.get("sec") || params.get("s") || params.get("yf") || params.get("yt")) && (
        <button
          onClick={() => {
            const q = params.get("q");
            start(() => router.push(q ? `/?q=${encodeURIComponent(q)}` : "/?t="));
          }}
          className="text-[14px] font-medium text-accent hover:underline underline-offset-4"
        >
          Clear filters
        </button>
      )}
    </aside>
  );
}
