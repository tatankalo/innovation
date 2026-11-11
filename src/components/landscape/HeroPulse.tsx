"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { money, num } from "@/lib/format";
import { ORDER, SHORT, UniCard, color, shortName, type Payload } from "./Landscape";
import { useZoomPan, ZoomControls } from "./useZoomPan";

const W = 975;
const H = 610;
const STEP_MS = 4200;
// "All sectors" first, then each named sector. "Other" is left out of the tour.
const TOUR: (string | null)[] = [null, ...ORDER.filter((k) => k !== "other")];

/** Eases a number toward its target so totals roll instead of jumping. */
function useRolling(target: number, ms = 900) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      const cur = a + (target - a) * e;
      from.current = cur;
      setV(cur);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export default function HeroPulse() {
  const [data, setData] = useState<Payload | null>(null);
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [still, setStill] = useState(false); // prefers-reduced-motion
  const zp = useZoomPan(W, H);
  const router = useRouter();
  const [active, setActive] = useState<number | null>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    fetch("/api/landscape")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Payload) => {
        if (!d.cells) return;
        setData(d);
        // Let the marks mount at zero size, then grow in.
        requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!data || paused || still || zp.zoomed || pinned) return; // hold the tour while someone explores the map
    const id = setInterval(() => setStep((s) => (s + 1) % TOUR.length), STEP_MS);
    return () => clearInterval(id);
  }, [data, paused, still, zp.zoomed, pinned]);

  const model = useMemo(() => {
    if (!data) return null;
    const unis = new Map<number, { id: number; name: string; x: number | null; y: number | null; state: string | null; by: Record<string, [number, number, number]>; total: number }>();
    for (const [id, name, state, x, y] of data.universities) unis.set(id, { id, name, state, x, y, by: {}, total: 0 });
    for (const [u, s, , a, d, p] of data.cells) {
      const rec = unis.get(u);
      if (!rec) continue;
      const k = data.sectors[s];
      const cur = (rec.by[k] ??= [0, 0, 0]);
      cur[0] += a;
      cur[1] += d;
      cur[2] += p;
      rec.total += d;
    }
    const nat: Record<string, [number, number, number]> = {};
    for (const [s, , , a, d, p] of data.national) {
      const cur = (nat[data.sectors[s]] ??= [0, 0, 0]);
      cur[0] += a;
      cur[1] += d;
      cur[2] += p;
    }
    const list = [...unis.values()].filter((u) => u.x != null && u.total > 0).map((u) => {
      let top = "other";
      let best = -1;
      for (const k of ORDER) if ((u.by[k]?.[1] ?? 0) > best) { best = u.by[k]?.[1] ?? 0; top = k; }
      return { ...u, dominant: top };
    });
    // Stable draw order (largest overall first) so marks never re-stack mid-animation.
    list.sort((a, b) => b.total - a.total);
    return { list, nat };
  }, [data]);

  const sector = TOUR[step];
  const frame = useMemo(() => {
    if (!model) return null;
    const val = (u: (typeof model.list)[number]) => (sector ? u.by[sector]?.[1] ?? 0 : u.total);
    const max = Math.max(1, ...model.list.map(val));
    const leaders = [...model.list].sort((a, b) => val(b) - val(a)).slice(0, 3);
    const tot: [number, number, number] = [0, 0, 0];
    for (const k of sector ? [sector] : ORDER) {
      const t = model.nat[k];
      if (t) { tot[0] += t[0]; tot[1] += t[1]; tot[2] += t[2]; }
    }
    return { val, max, leaders, tot };
  }, [model, sector]);

  const activeU = active != null ? model?.list.find((u) => u.id === active) ?? null : null;
  const card = (() => {
    if (!activeU) return null;
    const sx = activeU.x! * zp.k + zp.x;
    const sy = activeU.y! * zp.k + zp.y;
    return sx >= 0 && sx <= W && sy >= 0 && sy <= H ? { u: activeU, sx, sy } : null;
  })();

  const dollars = useRolling(frame?.tot[1] ?? 0);
  const awards = useRolling(frame?.tot[0] ?? 0);
  const patents = useRolling(frame?.tot[2] ?? 0);
  const ease = still ? "none" : "r 1100ms cubic-bezier(.2,.8,.2,1), fill 700ms ease-out, opacity 700ms ease-out";

  return (
    <section
      className="mt-4 border border-rule rounded-[2px] bg-surface overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        if (!pinned) setActive(null);
      }}
      aria-label="Animated map of NSF funding by technology sector"
    >
      <div className="grid lg:grid-cols-[340px_1fr]">
        <div className="p-6 sm:p-8 flex flex-col">
          <p className="label mb-4 flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full bg-accent ${paused || still ? "" : "animate-pulse"}`} />
            NSF funding since 2021
          </p>
          <div className="min-h-[76px]">
            <h2 className="font-serif text-[34px] leading-[38px] tracking-[-0.015em] flex items-start gap-3">
              {sector && <span className="mt-3.5 w-3 h-3 rounded-full shrink-0" style={{ background: color(sector) }} />}
              <span key={step} className="pulse-in inline-block">{sector ? SHORT[sector] : "Every sector"}</span>
            </h2>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <dd className="font-serif text-[26px] leading-8 tnum">{frame ? money(dollars) : "…"}</dd>
              <dt className="text-[12px] text-ink-3">NSF dollars</dt>
            </div>
            <div>
              <dd className="font-serif text-[26px] leading-8 tnum">{frame ? num(Math.round(awards)) : "…"}</dd>
              <dt className="text-[12px] text-ink-3">awards</dt>
            </div>
            <div>
              <dd className="font-serif text-[26px] leading-8 tnum">{frame ? num(Math.round(patents)) : "…"}</dd>
              <dt className="text-[12px] text-ink-3">patents</dt>
            </div>
          </dl>
          <div className="mt-6">
            <p className="label mb-2">Leading universities</p>
            <ol key={step} className="pulse-in space-y-1 text-[15px] min-h-[84px]">
              {frame?.leaders.map((u, i) => (
                <li key={u.id} className="flex justify-between gap-3">
                  <Link href={`/university/${u.id}`} className="truncate hover:text-accent">
                    <span className="font-mono text-[11px] text-ink-3 mr-2">{i + 1}</span>
                    {shortName(u.name)}
                  </Link>
                  <span className="font-mono text-[12px] text-ink-2 tnum">{money(frame.val(u))}</span>
                </li>
              ))}
            </ol>
          </div>
          {/* tour steps: also the control */}
          <div className="mt-auto pt-6">
            <div className="flex gap-1.5" role="tablist" aria-label="Sector">
              {TOUR.map((k, i) => (
                <button
                  key={k ?? "all"}
                  role="tab"
                  aria-selected={i === step}
                  aria-label={k ? SHORT[k] : "Every sector"}
                  title={k ? SHORT[k] : "Every sector"}
                  onClick={() => setStep(i)}
                  className="group flex-1 h-6 flex items-center"
                >
                  <span className="relative block w-full h-[3px] rounded-full bg-rule overflow-hidden group-hover:h-[5px] transition-[height]">
                    <span
                      key={i === step ? `on-${step}-${paused}-${zp.zoomed}-${pinned}` : "off"}
                      className={`absolute inset-y-0 left-0 rounded-full ${i === step && !paused && !still && !zp.zoomed && !pinned ? "pulse-fill" : ""}`}
                      style={{ background: k ? color(k) : "var(--ink)", width: i === step ? "100%" : "0%" }}
                    />
                  </span>
                </button>
              ))}
            </div>
            <Link href={sector ? `/landscape?sector=${sector}` : "/landscape"} className="mt-4 inline-block text-[15px] font-medium text-accent hover:underline underline-offset-4">
              Explore the landscape →
            </Link>
          </div>
        </div>

        <div className="relative border-t lg:border-t-0 lg:border-l border-rule bg-paper">
          <svg ref={zp.ref} style={zp.svgStyle} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label={`Universities sized by NSF dollars${sector ? ` in ${SHORT[sector]}` : ""}`}>
            <defs>
              <filter id="pulse-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation={10 / zp.k} />
              </filter>
            </defs>
            <g transform={zp.transform}>
            {data && <path d={data.nation} fill="var(--viz-land)" />}
            {data && <path d={data.borders} fill="none" stroke="var(--paper)" strokeWidth="1" vectorEffect="non-scaling-stroke" />}
            <g filter="url(#pulse-glow)" opacity="0.5">
              {model?.list.slice(0, 110).map((u) => (
                <circle key={u.id} cx={u.x!} cy={u.y!} r={ready && frame ? rad(frame.val(u), frame.max) * 1.8 * zp.markScale : 0} fill={color(sector ?? u.dominant)} style={{ transition: ease }} />
              ))}
            </g>
            <g>
              {model?.list.map((u, i) => {
                const v = frame ? frame.val(u) : 0;
                return (
                  <circle
                    key={u.id}
                    cx={u.x!}
                    cy={u.y!}
                    r={ready && v > 0 ? rad(v, frame!.max) * zp.markScale : 0}
                    fill={color(sector ?? u.dominant)}
                    fillOpacity={active == null || active === u.id ? 0.92 : 0.4}
                    onMouseEnter={() => !pinned && !zp.dragging && v > 0 && setActive(u.id)}
                    onClick={() => {
                      if (zp.moved.current) return; // that press was a drag, not a click
                      router.push(`/university/${u.id}`, { scroll: false }); // opens in the side sheet
                    }}
                    stroke={active === u.id ? "var(--ink)" : "var(--paper)"}
                    strokeWidth={active === u.id ? 2 : 1.25}
                    vectorEffect="non-scaling-stroke"
                    cursor="pointer"
                    style={{ transition: zp.dragging ? "none" : zp.zoomed ? "r 200ms ease-out, fill 700ms ease-out" : still || step > 0 ? ease : ease.replace("r 1100ms cubic-bezier(.2,.8,.2,1)", `r 1100ms cubic-bezier(.2,.8,.2,1) ${Math.min(i * 6, 900)}ms`) }}
                  />
                );
              })}
            </g>
            <g key={step} className="pulse-in hidden sm:block" style={{ pointerEvents: "none" }}>
              {frame?.leaders.map((u) => {
                const r = rad(frame.val(u), frame.max) * zp.markScale;
                const right = u.x! < W * 0.7;
                return (
                  <text key={u.id} x={right ? u.x! + r + 6 / zp.k : u.x! - r - 6 / zp.k} y={u.y! + 5 / zp.k} textAnchor={right ? "start" : "end"} fontSize={15 / zp.k} fontWeight="600" fill="var(--ink)" stroke="var(--paper)" strokeWidth={4 / zp.k} paintOrder="stroke" style={{ fontFamily: "var(--font-inter-tight)" }}>
                    {shortName(u.name)}
                  </text>
                );
              })}
            </g>
            </g>
          </svg>
          <ZoomControls zp={zp} />
          {card && (
            <div
              className="absolute z-10 w-[250px] bg-surface border border-rule rounded-[4px] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.14)] text-[13px]"
              style={{
                left: `${(card.sx / W) * 100}%`,
                top: `${(card.sy / H) * 100}%`,
                transform: `translate(${card.sx > W * 0.6 ? "calc(-100% - 14px)" : "14px"}, ${card.sy > H * 0.5 ? "-100%" : "0"})`,
                pointerEvents: pinned ? "auto" : "none",
              }}
            >
              <div className="flex justify-between gap-3">
                <div className="font-serif text-[18px] leading-[22px]">{card.u.name}</div>
                {pinned && (
                  <button aria-label="Close" onClick={() => { setPinned(false); setActive(null); }} className="text-ink-3 hover:text-ink leading-none text-[18px]">×</button>
                )}
              </div>
              <UniCard row={{ ...card.u, value: 0 }} metric="dollars" sector={sector} />
              {pinned ? (
                <Link href={`/university/${card.u.id}`} className="mt-3 inline-block font-medium text-accent hover:underline underline-offset-4">
                  Open university page →
                </Link>
              ) : (
                <p className="mt-2 text-[12px] text-ink-3">Click to open</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function rad(v: number, max: number) {
  return v <= 0 ? 0 : Math.max(2, Math.sqrt(v / max) * 30);
}
