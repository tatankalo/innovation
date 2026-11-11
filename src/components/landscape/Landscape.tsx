"use client";

import Link from "next/link";
import { hierarchy, treemap } from "d3-hierarchy";
import { useEffect, useMemo, useState } from "react";
import { LENSES, SECTORS, money, num } from "@/lib/format";

/* ---------- data ---------- */

type Payload = {
  sectors: string[];
  universities: [number, string, string | null, number | null, number | null][];
  cells: [number, number, number, number, number, number][]; // uni, sectorIdx, year, awards, dollars, patents
  national: [number, string, number, number, number, number][]; // sectorIdx, sub, year, awards, dollars, patents
  nation: string;
  borders: string;
};
type Metric = "dollars" | "awards" | "patents";
const METRICS: { key: Metric; label: string; unit: string }[] = [
  { key: "dollars", label: "NSF dollars", unit: "in NSF awards" },
  { key: "awards", label: "NSF awards", unit: "NSF awards" },
  { key: "patents", label: "Patents", unit: "patented inventions" },
];
const YEARS = [2021, 2022, 2023, 2024, 2025, 2026];

// Fixed slot order (validated for color-blind separation on both surfaces). Color follows the sector.
const ORDER = ["computing_ai", "materials_manufacturing", "climate_energy", "ag_food", "education_social", "robotics_hardware", "health_bio", "other"];
const SHORT: Record<string, string> = {
  computing_ai: "Computing and AI",
  materials_manufacturing: "Materials",
  climate_energy: "Climate and energy",
  ag_food: "Ag and food",
  education_social: "Education and social",
  robotics_hardware: "Robotics and hardware",
  health_bio: "Health and biotech",
  other: "Other",
};
const color = (sector: string) => `var(--viz-${sector})`;
const fmt = (m: Metric, v: number) => (m === "dollars" ? money(v) : num(v));
const pick = (m: Metric, a: number, d: number, p: number) => (m === "dollars" ? d : m === "awards" ? a : p);

const W = 975;
const H = 610;

export default function Landscape() {
  const [data, setData] = useState<Payload | null>(null);
  const [failed, setFailed] = useState(false);
  const [metric, setMetric] = useState<Metric>("dollars");
  const [sector, setSector] = useState<string | null>(null);
  const [yf, setYf] = useState(2021);
  const [yt, setYt] = useState(2026);
  const [active, setActive] = useState<number | null>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    fetch("/api/landscape")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Payload) => (d.cells ? setData(d) : setFailed(true)))
      .catch(() => setFailed(true));
  }, []);

  const model = useMemo(() => {
    if (!data) return null;
    const sKey = data.sectors;
    // Per university: value per sector for the chosen years, in all three measures.
    const unis = new Map<number, { id: number; name: string; state: string | null; x: number | null; y: number | null; by: Record<string, [number, number, number]> }>();
    for (const [id, name, state, x, y] of data.universities) unis.set(id, { id, name, state, x, y, by: {} });
    for (const [u, s, year, a, d, p] of data.cells) {
      if (year < yf || year > yt) continue;
      const rec = unis.get(u);
      if (!rec) continue;
      const cur = (rec.by[sKey[s]] ??= [0, 0, 0]);
      cur[0] += a;
      cur[1] += d;
      cur[2] += p;
    }
    // National totals per sector and per sub-topic.
    const nat: Record<string, [number, number, number]> = {};
    const subs: Record<string, Record<string, [number, number, number]>> = {};
    for (const [s, sub, year, a, d, p] of data.national) {
      if (year < yf || year > yt) continue;
      const k = sKey[s];
      const cur = (nat[k] ??= [0, 0, 0]);
      cur[0] += a;
      cur[1] += d;
      cur[2] += p;
      const sc = ((subs[k] ??= {})[sub] ??= [0, 0, 0]);
      sc[0] += a;
      sc[1] += d;
      sc[2] += p;
    }
    return { unis: [...unis.values()], nat, subs };
  }, [data, yf, yt]);

  const view = useMemo(() => {
    if (!model) return null;
    const val = (t?: [number, number, number]) => (t ? pick(metric, t[0], t[1], t[2]) : 0);
    const rows = model.unis
      .map((u) => {
        let total = 0;
        let top = "other";
        let topV = -1;
        for (const k of ORDER) {
          const v = val(u.by[k]);
          total += v;
          if (v > topV) {
            topV = v;
            top = k;
          }
        }
        const value = sector ? val(u.by[sector]) : total;
        return { ...u, value, total, dominant: sector ?? top };
      })
      .filter((u) => u.value > 0)
      .sort((a, b) => b.value - a.value);
    const max = rows[0]?.value ?? 1;
    const totals = ORDER.map((k) => ({ key: k, value: val(model.nat[k]), t: model.nat[k] ?? [0, 0, 0] }));
    const grand: [number, number, number] = [0, 0, 0];
    for (const k of sector ? [sector] : ORDER) {
      const t = model.nat[k];
      if (t) {
        grand[0] += t[0];
        grand[1] += t[1];
        grand[2] += t[2];
      }
    }
    return { rows, max, totals, grand };
  }, [model, metric, sector]);

  if (failed) return <p className="mt-12 text-ink-2">The landscape data did not load. Refresh the page to try again.</p>;

  const m = METRICS.find((x) => x.key === metric)!;
  const activeRow = view?.rows.find((r) => r.id === active) ?? null;
  const offMap = view ? view.rows.filter((r) => r.x == null).length : 0;

  return (
    <div className="viz mt-10">
      {/* ---------- controls: one row above everything, they drive all three views ---------- */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-rule py-4">
        <div role="group" aria-label="Measure" className="inline-flex border border-rule rounded-[2px] overflow-hidden">
          {METRICS.map((x) => (
            <button
              key={x.key}
              onClick={() => setMetric(x.key)}
              aria-pressed={metric === x.key}
              className={`h-9 px-3.5 text-[14px] font-medium ${metric === x.key ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"}`}
            >
              {x.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[14px] text-ink-2">
          <select aria-label="From year" value={yf} onChange={(e) => setYf(Math.min(Number(e.target.value), yt))} className="h-9 px-2 bg-surface border border-rule rounded-[2px] text-ink">
            {YEARS.map((y) => <option key={y}>{y}</option>)}
          </select>
          <span>to</span>
          <select aria-label="To year" value={yt} onChange={(e) => setYt(Math.max(Number(e.target.value), yf))} className="h-9 px-2 bg-surface border border-rule rounded-[2px] text-ink">
            {YEARS.map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>
        <div className="font-mono text-[12px] text-ink-3 tnum ml-auto">
          {view ? `${money(view.grand[1])} · ${num(view.grand[0])} awards · ${num(view.grand[2])} patents` : "Loading"}
        </div>
      </div>

      {/* Sector legend doubles as the filter. */}
      <div className="flex flex-wrap gap-2 py-4" role="group" aria-label="Sector">
        <button
          onClick={() => setSector(null)}
          aria-pressed={sector === null}
          className={`h-8 px-3 rounded-full border text-[13px] font-medium ${sector === null ? "border-ink text-ink" : "border-rule text-ink-2 hover:border-ink-3"}`}
        >
          All sectors
        </button>
        {ORDER.map((k) => (
          <button
            key={k}
            onClick={() => setSector(sector === k ? null : k)}
            aria-pressed={sector === k}
            className={`h-8 pl-2.5 pr-3 rounded-full border text-[13px] font-medium inline-flex items-center gap-2 ${
              sector === k ? "border-ink text-ink bg-surface" : sector ? "border-rule text-ink-3 hover:text-ink-2" : "border-rule text-ink-2 hover:border-ink-3"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color(k), opacity: sector && sector !== k ? 0.35 : 1 }} />
            {SHORT[k]}
          </button>
        ))}
      </div>

      {/* ---------- 1. map ---------- */}
      <section className="grid lg:grid-cols-[1fr_280px] gap-8 lg:gap-10 items-start">
        <div>
          <div className="relative" onMouseLeave={() => !pinned && setActive(null)}>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label={`Map of US universities sized by ${m.label}`}>
              <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="9" />
                </filter>
              </defs>
              {data && <path d={data.nation} fill="var(--viz-land)" />}
              {data && <path d={data.borders} fill="none" stroke="var(--paper)" strokeWidth="1" />}
              {/* soft heat under the marks */}
              <g filter="url(#glow)" opacity="0.42" style={{ pointerEvents: "none" }}>
                {view?.rows.filter((r) => r.x != null).slice(0, 120).map((r) => (
                  <circle key={r.id} cx={r.x!} cy={r.y!} r={radius(r.value, view.max) * 1.7} fill={color(r.dominant)} style={{ transition: "r 400ms ease-out, fill 400ms ease-out" }} />
                ))}
              </g>
              {/* marks: largest first so small ones stay reachable; surface ring separates overlaps */}
              <g>
                {view?.rows.filter((r) => r.x != null).map((r) => (
                  <circle
                    key={r.id}
                    cx={r.x!}
                    cy={r.y!}
                    r={radius(r.value, view.max)}
                    fill={color(r.dominant)}
                    fillOpacity={active == null || active === r.id ? 0.92 : 0.35}
                    stroke={active === r.id ? "var(--ink)" : "var(--paper)"}
                    strokeWidth={active === r.id ? 2 : 1.25}
                    style={{ transition: "r 400ms ease-out, fill 400ms ease-out, fill-opacity 150ms", cursor: "pointer" }}
                    onMouseEnter={() => !pinned && setActive(r.id)}
                    onClick={() => {
                      setActive(r.id);
                      setPinned(true);
                    }}
                  />
                ))}
              </g>
              {/* direct labels for the leaders only */}
              <g className="hidden sm:block" style={{ pointerEvents: "none" }}>
                {view && labelLeaders(view.rows, view.max).map((r) => (
                  <text key={r.id} x={r.lx} y={r.ly} textAnchor={r.anchor} fontSize="15" fontWeight="600" fill="var(--ink)" stroke="var(--paper)" strokeWidth="4" paintOrder="stroke" style={{ fontFamily: "var(--font-inter-tight)" }}>
                    {shortName(r.name)}
                  </text>
                ))}
              </g>
            </svg>

            {activeRow && activeRow.x != null && (
              <div
                className="absolute z-10 w-[260px] bg-surface border border-rule rounded-[4px] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] text-[13px]"
                style={{
                  left: `${(activeRow.x / W) * 100}%`,
                  top: `${(activeRow.y! / H) * 100}%`,
                  transform: `translate(${activeRow.x > W * 0.62 ? "calc(-100% - 14px)" : "14px"}, ${activeRow.y! > H * 0.55 ? "-100%" : "0"})`,
                  pointerEvents: pinned ? "auto" : "none",
                }}
              >
                <div className="flex justify-between gap-3">
                  <div className="font-serif text-[18px] leading-[22px]">{activeRow.name}</div>
                  {pinned && (
                    <button aria-label="Close" onClick={() => { setPinned(false); setActive(null); }} className="text-ink-3 hover:text-ink leading-none text-[18px]">×</button>
                  )}
                </div>
                <UniCard row={activeRow} metric={metric} sector={sector} />
                {pinned && (
                  <Link href={`/university/${activeRow.id}`} className="mt-3 inline-block font-medium text-accent hover:underline underline-offset-4">
                    Open university page →
                  </Link>
                )}
              </div>
            )}
          </div>
          <p className="mt-3 text-[12px] leading-5 text-ink-3">
            Circle area shows {m.key === "dollars" ? "NSF dollars" : m.key === "awards" ? "the number of NSF awards" : "the number of patented inventions"}
            {sector ? ` in ${SHORT[sector].toLowerCase()}` : ""}, {yf} to {yt}. Color shows {sector ? "the selected sector" : "each university's largest sector"}.
            Click a circle to pin it.{offMap > 0 ? ` ${offMap} universities have no map coordinates and appear only in the list.` : ""} Patents shared across a
            university system are not placed on a single campus.
          </p>
        </div>

        {/* ranked list: the table view of the map */}
        <div>
          <h2 className="label mb-3">Top universities{sector ? ` · ${SHORT[sector]}` : ""}</h2>
          <ol>
            {(view?.rows ?? []).slice(0, 12).map((r, i) => (
              <li key={r.id} onMouseEnter={() => !pinned && setActive(r.id)} onMouseLeave={() => !pinned && setActive(null)}>
                <Link href={`/university/${r.id}`} className={`block py-2 border-b border-rule ${active === r.id ? "text-accent" : "hover:text-accent"}`}>
                  <div className="flex items-baseline justify-between gap-3 text-[14px]">
                    <span className="truncate">
                      <span className="font-mono text-[11px] text-ink-3 mr-2 tnum">{String(i + 1).padStart(2, "0")}</span>
                      {shortName(r.name)}
                    </span>
                    <span className="font-mono text-[12px] text-ink-2 tnum shrink-0">{fmt(metric, r.value)}</span>
                  </div>
                  <div className="mt-1.5 h-[3px] bg-rule rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(r.value / (view?.max ?? 1)) * 100}%`, background: color(r.dominant), transition: "width 400ms ease-out" }} />
                  </div>
                </Link>
              </li>
            ))}
          </ol>
          {!view && <div className="h-64 bg-surface border border-rule rounded-[2px] animate-pulse" />}
        </div>
      </section>

      {/* ---------- 2. treemap ---------- */}
      <section className="mt-20">
        <div className="flex items-baseline justify-between border-b border-rule pb-3 mb-5 gap-4 flex-wrap">
          <h2 className="label">
            Technology areas by {m.key === "patents" ? "patents" : m.label.replace("NSF ", "NSF\u00a0")}
            {sector && (
              <>
                {" "}/ <button onClick={() => setSector(null)} className="underline underline-offset-4 hover:text-ink">All sectors</button> / <span className="text-ink">{SHORT[sector]}</span>
              </>
            )}
          </h2>
          <span className="text-[13px] text-ink-3">{sector ? "Click a box to open the matching search" : "Click a sector to see what is inside"}</span>
        </div>
        {view && model && <Treemap view={view} model={model} metric={metric} sector={sector} setSector={setSector} yf={yf} yt={yt} />}
        {!view && <div className="h-[420px] bg-surface border border-rule rounded-[2px] animate-pulse" />}
      </section>

      {/* ---------- 3. funding share vs patent share ---------- */}
      <section className="mt-20">
        <div className="flex items-baseline justify-between border-b border-rule pb-3 mb-2 gap-4 flex-wrap">
          <h2 className="label">Where funding outpaces patents</h2>
          <span className="flex items-center gap-5 text-[13px] text-ink-2">
            <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-ink" /> Share of NSF dollars</span>
            <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-ink" /> Share of patents</span>
          </span>
        </div>
        {model && <Gap model={model} sector={sector} setSector={setSector} />}
        <p className="mt-4 text-[12px] leading-5 text-ink-3 max-w-[70ch]">
          Each row compares a sector&apos;s share of all NSF dollars with its share of all patented inventions, {yf} to {yt}. A long gap to the
          right of the ring means research money has not yet turned into patents. Patents trail grants by years and many come from non-NSF
          funding, so read this as a prompt for a conversation, not a verdict.
        </p>
      </section>
    </div>
  );
}

/* ---------- pieces ---------- */

function radius(v: number, max: number) {
  return Math.max(2.2, Math.sqrt(v / max) * 30);
}

function shortName(n: string) {
  return n
    .replace(/^(The )?Regents of the /i, "")
    .replace(/Pennsylvania State Univ University Park/, "Penn State")
    .replace(/Massachusetts Institute of Technology/, "MIT")
    .replace(/, College Park$/, "")
    .replace(/ - Ann Arbor$/, "")
    .replace(/-Main Campus$| Main Campus$/, "")
    .replace(/^University of California[- ,]+/i, "UC ")
    .replace(/University/g, "U.")
    .replace(/Institute of Technology/g, "Tech");
}

type Row = { id: number; name: string; state: string | null; x: number | null; y: number | null; value: number; dominant: string; by: Record<string, [number, number, number]> };

/** Label the biggest marks, skipping any label that would land on one already placed. */
function labelLeaders(rows: Row[], max: number) {
  const placed: { x: number; y: number; w: number }[] = [];
  const out: (Row & { lx: number; ly: number; anchor: "start" | "end" })[] = [];
  for (const r of rows) {
    if (out.length >= 6) break;
    if (r.x == null || r.y == null) continue;
    const rad = radius(r.value, max);
    const right = r.x < W * 0.72;
    const lx = right ? r.x + rad + 5 : r.x - rad - 5;
    const ly = r.y + 4;
    const w = shortName(r.name).length * 8.2;
    const x0 = right ? lx : lx - w;
    if (placed.some((p) => Math.abs(p.y - ly) < 19 && x0 < p.x + p.w && p.x < x0 + w)) continue;
    placed.push({ x: x0, y: ly, w });
    out.push({ ...r, lx, ly, anchor: right ? "start" : "end" });
  }
  return out;
}

function UniCard({ row, metric, sector }: { row: Row; metric: Metric; sector: string | null }) {
  const tot: [number, number, number] = [0, 0, 0];
  for (const k of sector ? [sector] : ORDER) {
    const t = row.by[k];
    if (t) {
      tot[0] += t[0];
      tot[1] += t[1];
      tot[2] += t[2];
    }
  }
  const parts = ORDER.map((k) => ({ k, v: row.by[k] ? pick(metric, ...row.by[k]) : 0 })).filter((p) => p.v > 0);
  const sum = parts.reduce((a, b) => a + b.v, 0) || 1;
  const top = [...parts].sort((a, b) => b.v - a.v).slice(0, 3);
  return (
    <div className="mt-2">
      <div className="font-mono text-[12px] text-ink-2 tnum">
        {money(tot[1])} · {num(tot[0])} awards · {num(tot[2])} patents{sector ? ` in ${SHORT[sector].toLowerCase()}` : ""}
      </div>
      <div className="mt-3 flex h-2 gap-[2px]" aria-hidden>
        {parts.map((p) => (
          <div key={p.k} style={{ width: `${(p.v / sum) * 100}%`, background: color(p.k), opacity: sector && sector !== p.k ? 0.3 : 1 }} className="rounded-[1px]" />
        ))}
      </div>
      <ul className="mt-2 space-y-0.5 text-ink-2">
        {top.map((p) => (
          <li key={p.k} className="flex justify-between gap-3">
            <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: color(p.k) }} />{SHORT[p.k]}</span>
            <span className="font-mono text-[12px] tnum">{Math.round((p.v / sum) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Model = { unis: { id: number; name: string; by: Record<string, [number, number, number]> }[]; nat: Record<string, [number, number, number]>; subs: Record<string, Record<string, [number, number, number]>> };
type Leaf = { key: string; label: string; value: number; sector: string; href?: string; drill?: string; t?: [number, number, number] };

function Treemap({ view, model, metric, sector, setSector, yf, yt }: {
  view: { totals: { key: string; value: number; t: [number, number, number] }[]; rows: Row[] };
  model: Model; metric: Metric; sector: string | null; setSector: (s: string | null) => void; yf: number; yt: number;
}) {
  const years = `${yf !== 2021 ? `&yf=${yf}` : ""}${yt !== 2026 ? `&yt=${yt}` : ""}`;
  const leaves: Leaf[] = useMemo(() => {
    if (!sector) return view.totals.filter((t) => t.value > 0).map((t) => ({ key: t.key, label: SECTORS[t.key] ?? t.key, value: t.value, sector: t.key, drill: t.key, t: t.t }));
    const lens = sector === "climate_energy" ? "climate" : sector === "ag_food" ? "agtech" : null;
    if (lens) {
      return Object.entries(model.subs[sector] ?? {})
        .map(([sub, t]) => ({
          key: sub || "_other",
          label: sub ? LENSES[lens].subs[sub] ?? sub : `Other ${SHORT[sector].toLowerCase()}`,
          value: pick(metric, ...t),
          sector,
          t,
          href: sub ? `/?l=${lens}&sub=${sub}&sec=${sector}&o=readiness${years}` : `/?sec=${sector}&o=readiness${years}`,
        }))
        .filter((l) => l.value > 0);
    }
    const top = view.rows.slice(0, 14);
    const rest = view.rows.slice(14).reduce((a, r) => a + r.value, 0);
    const out: Leaf[] = top.map((r) => ({ key: String(r.id), label: shortName(r.name), value: r.value, sector, t: r.by[sector], href: `/?u=${r.id}&sec=${sector}&o=readiness${years}` }));
    if (rest > 0) out.push({ key: "_rest", label: `${view.rows.length - 14} more universities`, value: rest, sector, href: `/?sec=${sector}&o=readiness${years}` });
    return out;
  }, [view, model, metric, sector, years]);

  const TW = 1120;
  const TH = 460;
  const nodes = useMemo(() => {
    const root = hierarchy<{ children?: Leaf[] } | Leaf>({ children: leaves }).sum((d) => ("value" in d ? d.value : 0)).sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    treemap<{ children?: Leaf[] } | Leaf>().size([TW, TH]).paddingInner(3).round(true)(root);
    return root.leaves() as unknown as { x0: number; x1: number; y0: number; y1: number; data: Leaf }[];
  }, [leaves]);
  const total = leaves.reduce((a, b) => a + b.value, 0) || 1;

  return (
    <div className="relative w-full" style={{ aspectRatio: `${TW} / ${TH}`, minHeight: 340 }}>
      {nodes.map((n) => {
        const w = n.x1 - n.x0;
        const h = n.y1 - n.y0;
        const big = w > 150 && h > 84;
        const mid = w > 84 && h > 44;
        const body = (
          <>
            <span className="absolute inset-x-0 top-0 h-[4px]" style={{ background: color(n.data.sector) }} />
            {mid && (
              <span className="absolute left-3 right-2 top-3.5 block">
                <span className={`block font-serif leading-tight ${big ? "text-[22px]" : "text-[14px]"} line-clamp-2`}>{w < 230 && SHORT[n.data.key] ? SHORT[n.data.key] : n.data.label}</span>
                <span className={`block font-mono tnum text-ink-2 ${big ? "text-[13px] mt-1" : "text-[11px]"}`}>
                  {fmt(metric, n.data.value)} · {Math.round((n.data.value / total) * 100)}%
                </span>
                {big && n.data.t && h > 120 && (
                  <span className="block font-mono text-[11px] text-ink-3 mt-1 tnum">
                    {num(n.data.t[0])} awards · {num(n.data.t[2])} patents
                  </span>
                )}
              </span>
            )}
          </>
        );
        const style = {
          left: `${(n.x0 / TW) * 100}%`,
          top: `${(n.y0 / TH) * 100}%`,
          width: `${(w / TW) * 100}%`,
          height: `${(h / TH) * 100}%`,
          background: `color-mix(in srgb, ${color(n.data.sector)} 26%, var(--surface))`,
          transition: "left 400ms ease-out, top 400ms ease-out, width 400ms ease-out, height 400ms ease-out",
        } as const;
        const cls = "absolute overflow-hidden text-left text-ink hover:opacity-85 rounded-[2px]";
        const title = `${n.data.label}: ${fmt(metric, n.data.value)} (${Math.round((n.data.value / total) * 100)}%)`;
        return n.data.drill ? (
          <button key={n.data.key} style={style} className={cls} title={title} onClick={() => setSector(n.data.drill!)}>{body}</button>
        ) : (
          <Link key={n.data.key} href={n.data.href ?? "/"} style={style} className={cls} title={title}>{body}</Link>
        );
      })}
    </div>
  );
}

function Gap({ model, sector, setSector }: { model: Model; sector: string | null; setSector: (s: string | null) => void }) {
  const totD = ORDER.reduce((a, k) => a + (model.nat[k]?.[1] ?? 0), 0) || 1;
  const totP = ORDER.reduce((a, k) => a + (model.nat[k]?.[2] ?? 0), 0) || 1;
  const rows = ORDER.map((k) => ({ k, d: ((model.nat[k]?.[1] ?? 0) / totD) * 100, p: ((model.nat[k]?.[2] ?? 0) / totP) * 100 })).sort((a, b) => b.d - b.p - (a.d - a.p));
  const max = Math.ceil(Math.max(...rows.map((r) => Math.max(r.d, r.p))) / 10) * 10 || 10;
  const ticks = Array.from({ length: max / 10 + 1 }, (_, i) => i * 10);
  return (
    <div>
      <div className="grid grid-cols-[150px_1fr_84px] sm:grid-cols-[210px_1fr_110px] items-center text-[11px] font-mono text-ink-3">
        <span />
        <div className="relative h-5">
          {ticks.map((t) => <span key={t} className="absolute -translate-x-1/2" style={{ left: `${(t / max) * 100}%` }}>{t}%</span>)}
        </div>
        <span />
      </div>
      {rows.map((r) => {
        const gap = r.d - r.p;
        const dim = sector && sector !== r.k;
        return (
          <button
            key={r.k}
            onClick={() => setSector(sector === r.k ? null : r.k)}
            title={`${SHORT[r.k]}: ${r.d.toFixed(1)}% of NSF dollars, ${r.p.toFixed(1)}% of patents`}
            className={`w-full grid grid-cols-[150px_1fr_84px] sm:grid-cols-[210px_1fr_110px] items-center h-11 border-t border-rule text-left hover:bg-surface ${dim ? "opacity-40" : ""}`}
          >
            <span className="text-[14px] font-medium truncate pr-3 inline-flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color(r.k) }} />
              {SHORT[r.k]}
            </span>
            <span className="relative h-full">
              {ticks.map((t) => <span key={t} className="absolute top-0 bottom-0 w-px bg-rule" style={{ left: `${(t / max) * 100}%` }} />)}
              <span className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full" style={{ left: `${(Math.min(r.d, r.p) / max) * 100}%`, width: `${(Math.abs(gap) / max) * 100}%`, background: color(r.k), transition: "all 400ms ease-out" }} />
              <span className="absolute top-1/2 w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-paper" style={{ left: `${(r.p / max) * 100}%`, borderColor: "var(--ink)", transition: "left 400ms ease-out" }} />
              <span className="absolute top-1/2 w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-paper" style={{ left: `${(r.d / max) * 100}%`, background: "var(--ink)", transition: "left 400ms ease-out" }} />
            </span>
            <span className="font-mono text-[12px] tnum text-right text-ink-2">
              {gap >= 0 ? "+" : "−"}{Math.abs(gap).toFixed(0)} pts {gap >= 0 ? "funding" : "patents"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
