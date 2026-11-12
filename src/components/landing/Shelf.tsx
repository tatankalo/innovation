"use client";

import Link from "next/link";
import { useState } from "react";
import { money, num } from "@/lib/format";
import type { Spine } from "@/lib/landing";

type Counts = { total: number; icorps: number; never: number };

// Spine colors: background, text. Tokens only, so both themes work.
const TONES: [string, string][] = [
  ["var(--ink-2)", "var(--paper)"],
  ["var(--ink-3)", "var(--paper)"],
  ["var(--ink)", "var(--paper)"],
  ["var(--ink-2)", "var(--paper)"],
  ["var(--rule)", "var(--ink)"],
  ["var(--panel)", "var(--ink)"],
  ["var(--wash)", "var(--ink)"],
  ["var(--ink-3)", "var(--paper)"],
  ["var(--rule)", "var(--ink)"],
  ["var(--ink-2)", "var(--paper)"],
];

/** Shows one value per screen size: phone, tablet, desktop. */
function Per({ v }: { v: [number, number, number] }) {
  return (
    <>
      <span className="sm:hidden">{v[0]}</span>
      <span className="hidden sm:inline lg:hidden">{v[1]}</span>
      <span className="hidden lg:inline">{v[2]}</span>
    </>
  );
}

export function ShelfCount({ counts, k }: { counts: { phone: Counts; tablet: Counts; desktop: Counts }; k: keyof Counts }) {
  return <Per v={[counts.phone[k], counts.tablet[k], counts.desktop[k]]} />;
}

/**
 * The landing hero. `children` is the server-rendered headline and search column.
 * The shelf shows one real patent per inventor. Hover or focus opens it in the card. Click goes to the patent.
 */
export default function Shelf({
  rows,
  open,
  visible,
  counts,
  children,
}: {
  rows: Spine[][];
  open: number;
  visible: { phone: number; tablet: number; desktop: number };
  counts: { phone: Counts; tablet: Counts; desktop: Counts };
  children: React.ReactNode;
}) {
  const all = rows.flat();
  const [active, setActive] = useState(open);
  const s = all[active] ?? all[0];
  let orange = 0;

  return (
    <section className="pt-10 sm:pt-14 grid lg:grid-cols-[minmax(0,1fr)_372px] gap-x-12 gap-y-8 lg:gap-y-10" aria-label="The shelf">
      <div className="min-w-0">{children}</div>

      <div className="min-w-0 lg:col-span-2 lg:order-3">
        {rows.map((row, ri) => (
          <div key={ri}>
            <ul className="flex items-end gap-[2px] h-[230px]" aria-label={`Shelf ${ri + 1}: one patent per inventor`}>
              {row.map((x, i) => {
                const idx = ri * row.length + i;
                const tone = TONES[(i * 7 + ri * 3 + x.t.length) % TONES.length];
                const h = Math.min(206, Math.round(x.t.length * 5.5 + 28 + ((i * 37 + ri * 11) % 5) * 4));
                const show = i < visible.phone ? "flex" : i < visible.tablet ? "hidden sm:flex" : "hidden lg:flex";
                const delay = x.ic ? 500 + 140 * orange++ : 0;
                return (
                  <li key={x.f} className={`${show} items-end min-w-0`} style={{ flex: `${(18 + 2.2 * Math.sqrt(Math.min(x.p, 40))).toFixed(1)} 1 0` }}>
                    <Link
                      href={`/patent/${x.f}`}
                      scroll={false}
                      onMouseEnter={() => setActive(idx)}
                      onFocus={() => setActive(idx)}
                      aria-label={`${x.t}. ${x.n}, ${x.u}. ${x.ic ? "Through I-Corps" : "Never through I-Corps"}.`}
                      className={`spine ${x.ic ? "spine-out" : ""} ${idx === active ? "spine-on" : ""}`}
                      style={{
                        height: h,
                        background: x.ic ? "var(--accent)" : tone[0],
                        color: x.ic ? "var(--paper)" : tone[1],
                        animationDelay: x.ic ? `${delay}ms` : undefined,
                      }}
                    >
                      <span aria-hidden>{x.t}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="h-[9px] bg-ink mb-4 shadow-[0_6px_10px_-4px_rgba(0,0,0,0.3)]" aria-hidden />
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-ink-2">
          <span className="inline-flex items-center gap-2">
            <i className="w-[11px] h-4 rounded-[1px] bg-ink-3" aria-hidden />
            <b className="font-bold text-ink tnum"><ShelfCount counts={counts} k="never" /></b> never through I-Corps
          </span>
          <span className="inline-flex items-center gap-2">
            <i className="w-[11px] h-4 rounded-[1px] bg-accent" aria-hidden />
            <b className="font-bold text-ink tnum"><ShelfCount counts={counts} k="icorps" /></b> through I-Corps
          </span>
          <span className="hidden sm:inline">Thicker spine, more patent families</span>
          <span className="text-ink-3 lg:ml-auto">NSF awards and Google Patents, 2021 to 2026</span>
        </div>
      </div>

      <aside className="min-w-0 lg:order-2 lg:self-start bg-surface border border-rule border-t-4 border-t-ink px-5 pt-4 pb-5" aria-live="polite">
        <p className="label">One spine, opened</p>
        <h3 className="mt-2 font-serif font-medium text-[26px] leading-[30px] tracking-[-0.01em] min-h-[60px] lg:min-h-0">{s.t}</h3>
        <p className="mt-2 text-[14px] leading-5 text-ink-2 min-h-[40px]">
          <span className="font-semibold text-ink">{s.n}</span>
          <br />
          <span className="block truncate">{s.u}</span>
        </p>
        <dl className="mt-4 pt-3 border-t border-rule grid grid-cols-3">
          <div>
            <dd className="font-serif text-[22px] leading-7 tnum">{num(s.p)}</dd>
            <dt className="text-[12px] leading-4 text-ink-3">{s.p === 1 ? "patent family" : "patent families"}</dt>
          </div>
          <div className="pl-3 border-l border-rule">
            <dd className="font-serif text-[22px] leading-7 tnum">{money(s.d)}</dd>
            <dt className="text-[12px] leading-4 text-ink-3">in NSF awards</dt>
          </div>
          <div className="pl-3 border-l border-rule">
            <dd className="font-serif text-[22px] leading-7 tnum text-accent">{num(s.nic)}</dd>
            <dt className="text-[12px] leading-4 text-ink-3">{s.nic === 1 ? "I-Corps award" : "I-Corps awards"}</dt>
          </div>
        </dl>
        <Link href={`/patent/${s.f}`} scroll={false} className="mt-4 inline-block text-[14px] font-semibold text-accent hover:underline underline-offset-4">
          Open the patent →
        </Link>
      </aside>
    </section>
  );
}
