"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { num } from "@/lib/format";
import { CUTS, MIN_BASE, STAGES, total, type PipeUni, type Totals } from "@/lib/pipeline";

const fmt = (v: number | null, d = 1) => (v == null ? "–" : v.toFixed(v >= 100 ? 0 : d));

function Bar({ v, max, base, tone }: { v: number | null; max: number; base: number | null; tone: string }) {
  const w = v == null || !max ? 0 : Math.max(2, (100 * v) / max);
  const b = base == null || !max ? null : (100 * base) / max;
  return (
    <div className="relative h-3 bg-wash rounded-[1px]" aria-hidden>
      <div className={`absolute inset-y-0 left-0 ${tone}`} style={{ width: `${Math.min(w, 100)}%` }} />
      {b != null && <div className="absolute -inset-y-1 w-px bg-ink" style={{ left: `${Math.min(b, 100)}%` }} />}
    </div>
  );
}

export default function Explorer({ unis }: { unis: PipeUni[] }) {
  const [cut, setCut] = useState("type");
  const [sort, setSort] = useState<keyof PipeUni | "gap" | "rate">("gap");
  const [group, setGroup] = useState<string | null>(null);
  const all = useMemo(() => total(unis), [unis]);
  const c = CUTS.find((x) => x.key === cut)!;
  const rows = useMemo(
    () =>
      c.groups
        .map((g) => ({ label: g.label, test: g.test, t: total(unis.filter(g.test)) }))
        .filter((g) => g.t.n > 0),
    [c, unis],
  );
  const base = STAGES.map((s) => s.rate(all));
  const max = STAGES.map((s, i) => Math.max(base[i] ?? 0, ...rows.map((r) => s.rate(r.t) ?? 0)) * 1.08);

  // The stage where each group falls furthest below the all-university rate.
  const gaps = rows.map((r) => {
    let worst: { i: number; ratio: number } | null = null;
    STAGES.forEach((s, i) => {
      const v = s.rate(r.t);
      const b = base[i];
      if (v == null || !b || s.base(r.t) < MIN_BASE) return;
      const ratio = v / b;
      if (!worst || ratio < worst.ratio) worst = { i, ratio };
    });
    return worst as { i: number; ratio: number } | null;
  });

  const tableRows = useMemo(() => {
    const g = group ? c.groups.find((x) => x.label === group) : null;
    const list = unis.filter((u) => (g ? g.test(u) : true)).map((u) => ({
      ...u,
      gap: u.inventors - u.inventors_icorps,
      rate: u.inventors ? u.inventors_icorps / u.inventors : -1,
    }));
    const k = sort;
    list.sort((a, b) => (k === "rate" ? (a.rate < 0 ? 1 : b.rate < 0 ? -1 : a.rate - b.rate) : Number(b[k]) - Number(a[k])));
    return list.slice(0, 40);
  }, [unis, group, sort, c]);

  const tones = ["bg-band", "bg-accent", "bg-brick", "bg-teal"];

  return (
    <div>
      <div className="flex flex-wrap gap-2 no-print" role="tablist" aria-label="Cut the pipeline by">
        {CUTS.map((x) => (
          <button
            key={x.key}
            role="tab"
            aria-selected={cut === x.key}
            onClick={() => {
              setCut(x.key);
              setGroup(null);
            }}
            className={`h-9 px-4 rounded-[2px] border text-[14px] font-semibold ${cut === x.key ? "bg-ink text-paper border-ink" : "border-rule hover:border-ink"}`}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-[14px] border-collapse">
          <thead>
            <tr className="text-left align-bottom">
              <th className="py-2 pr-4 font-semibold w-[190px]">Group</th>
              {STAGES.map((s, i) => (
                <th key={s.key} className="py-2 px-3 font-semibold">
                  <span className="flex items-center gap-2">
                    <span className={`inline-block w-2.5 h-2.5 ${tones[i]}`} />
                    {s.label}
                  </span>
                  <span className="block text-[12px] font-normal text-ink-3 leading-4 mt-0.5">{s.unit}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={r.label} className="border-t border-rule align-top">
                <td className="py-3 pr-4">
                  <button onClick={() => setGroup(group === r.label ? null : r.label)} className="text-left font-semibold hover:text-accent">
                    {r.label}
                  </button>
                  <span className="block text-[12px] text-ink-3 tnum">
                    {num(r.t.n)} universities · {num(r.t.researchers)} researchers
                  </span>
                </td>
                {STAGES.map((s, i) => {
                  const v = s.rate(r.t);
                  const isGap = gaps[ri]?.i === i && (gaps[ri]?.ratio ?? 1) < 0.85;
                  const thin = s.base(r.t) < MIN_BASE;
                  return (
                    <td key={s.key} className={`py-3 px-3 ${isGap ? "bg-accent-wash" : ""} ${thin ? "opacity-45" : ""}`}>
                      <span className={`font-serif tnum text-[20px] leading-none ${isGap ? "text-brick" : ""}`}>{fmt(v)}</span>
                      {thin && <span className="ml-1.5 text-[11px] text-ink-3">small sample</span>}
                      <div className="mt-2">
                        <Bar v={v} max={max[i]} base={base[i]} tone={tones[i]} />
                      </div>
                      {isGap && <span className="block mt-1.5 text-[12px] font-semibold text-brick">Biggest drop-off</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="border-t-2 border-ink align-top">
              <td className="py-3 pr-4 font-semibold">
                All universities
                <span className="block text-[12px] font-normal text-ink-3 tnum">{num(all.n)} universities</span>
              </td>
              {STAGES.map((s, i) => (
                <td key={s.key} className="py-3 px-3 font-serif tnum text-[20px]">
                  {fmt(base[i])}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[13px] text-ink-3 max-w-[90ch]">
        The black tick on each bar is the all-university rate. Shaded cells mark the handoff where a group falls furthest below it. Faded rates rest on fewer than 30 people or teams.
        Click a group to filter the university table below.
      </p>

      <Counts rows={rows.map((r) => ({ label: r.label, t: r.t }))} all={all} />

      <div className="mt-16 flex items-baseline justify-between gap-4 flex-wrap border-b border-rule pb-3 mb-4">
        <h2 className="label">Universities {group ? `· ${group}` : ""}</h2>
        <div className="text-[13px] text-ink-3 flex gap-3 flex-wrap items-center no-print">
          Sort by
          {(
            [
              ["gap", "Inventors not through I-Corps"],
              ["rate", "Lowest I-Corps share"],
              ["families", "Patent families"],
              ["startups", "Startups"],
            ] as const
          ).map(([k, l]) => (
            <button key={k} onClick={() => setSort(k)} className={`font-semibold ${sort === k ? "text-ink underline underline-offset-4" : "text-accent hover:underline underline-offset-4"}`}>
              {l}
            </button>
          ))}
          {group && (
            <button onClick={() => setGroup(null)} className="font-semibold text-accent">
              Clear filter
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-[14px] border-collapse">
          <thead>
            <tr className="text-left text-[12px] uppercase tracking-[0.06em] text-ink-3">
              <th className="py-2 pr-3 font-semibold">University</th>
              <th className="py-2 px-2 font-semibold">Type</th>
              <th className="py-2 px-2 font-semibold text-right">Articles</th>
              <th className="py-2 px-2 font-semibold text-right">Patent families</th>
              <th className="py-2 px-2 font-semibold text-right">Inventors</th>
              <th className="py-2 px-2 font-semibold text-right">Through I-Corps</th>
              <th className="py-2 px-2 font-semibold text-right">Not yet</th>
              <th className="py-2 pl-2 font-semibold text-right">Startups</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((u) => (
              <tr key={u.id} className="border-t border-rule">
                <td className="py-2 pr-3">
                  <Link href={`/university/${u.id}`} className="font-semibold hover:text-accent">
                    {u.name}
                  </Link>
                  <span className="block text-[12px] text-ink-3">
                    {u.state}
                    {u.epscor ? " · EPSCoR" : ""}
                    {u.hbcu ? " · HBCU" : ""}
                    {u.land_grant ? " · Land-grant" : ""}
                  </span>
                </td>
                <td className="py-2 px-2 text-ink-2">{u.grp}</td>
                <td className="py-2 px-2 text-right tnum">{num(u.pubs)}</td>
                <td className="py-2 px-2 text-right tnum">{num(u.families)}</td>
                <td className="py-2 px-2 text-right tnum">{num(u.inventors)}</td>
                <td className="py-2 px-2 text-right tnum">
                  {num(u.inventors_icorps)}
                  <span className="text-ink-3"> {u.inventors ? `${Math.round((100 * u.inventors_icorps) / u.inventors)}%` : ""}</span>
                </td>
                <td className="py-2 px-2 text-right tnum font-semibold text-brick">
                  <Link href={`/people?uni=${u.id}`} className="hover:underline underline-offset-4">
                    {num(u.gap)}
                  </Link>
                </td>
                <td className="py-2 pl-2 text-right tnum">{u.startups ? num(u.startups) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[13px] text-ink-3">Top 40 shown. &ldquo;Not yet&rdquo; opens that university&apos;s Pioneer shortlist.</p>
    </div>
  );
}

function Counts({ rows, all }: { rows: { label: string; t: Totals }[]; all: Totals }) {
  const cols: [keyof Totals, string][] = [
    ["pubs", "Articles"],
    ["awards", "NSF awards"],
    ["researchers", "NSF researchers"],
    ["families", "Patent families"],
    ["inventors", "Inventors"],
    ["icorps", "I-Corps teams"],
    ["inventors_icorps", "Inventors in I-Corps"],
    ["startups", "Startups"],
  ];
  return (
    <details className="mt-8 group">
      <summary className="cursor-pointer text-[14px] font-semibold text-accent no-print">Show the counts behind the rates</summary>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-[13px] border-collapse">
          <thead>
            <tr className="text-left text-ink-3">
              <th className="py-2 pr-3 font-semibold">Group</th>
              {cols.map(([, l]) => (
                <th key={l} className="py-2 px-2 font-semibold text-right">
                  {l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...rows, { label: "All universities", t: all }].map((r) => (
              <tr key={r.label} className="border-t border-rule">
                <td className="py-2 pr-3 font-semibold">{r.label}</td>
                {cols.map(([k]) => (
                  <td key={k} className="py-2 px-2 text-right tnum">
                    {num(r.t[k] as number)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
