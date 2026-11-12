"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Spike, SpikeLabel } from "@/lib/landing";
import { useZoomPan, ZoomControls } from "@/components/landscape/useZoomPan";

const HALF = 4; // half the spike base, in map units at zoom 1
const LENS = 120; // lens radius in screen-sized map units at zoom 1
const DISTORT = 3; // fisheye strength

const REGIONS: { key: string; label: string; states: string[] }[] = [
  { key: "ne", label: "Northeast", states: ["ME", "NH", "VT", "MA", "RI", "CT", "NY", "NJ", "PA"] },
  { key: "mw", label: "Midwest", states: ["OH", "MI", "IN", "IL", "WI", "MN", "IA", "MO", "KS", "NE", "SD", "ND"] },
  { key: "so", label: "South", states: ["DE", "MD", "DC", "VA", "WV", "NC", "SC", "GA", "FL", "KY", "TN", "AL", "MS", "AR", "LA", "OK", "TX"] },
  { key: "we", label: "West", states: ["WA", "OR", "CA", "NV", "ID", "MT", "WY", "UT", "CO", "AZ", "NM"] },
];

/** Shorter university names for zoomed-in labels. */
function shortUni(n: string) {
  return n
    .replace(/^The /, "")
    .replace(/^Regents of the /i, "")
    .replace(/ - .*$/, "")
    .replace(/^University of California[- ,]+/, "UC ")
    .replace(/Massachusetts Institute of Technology/, "MIT")
    .replace(/Georgia Institute of Technology.*/, "Georgia Tech")
    .replace(/Institute of Technology/, "Tech")
    .replace(/Polytechnic Institute/, "Poly")
    .replace(/^University of /, "U. of ")
    .replace(/ University$/, "")
    .replace(/ State University/, " State")
    .replace(/, Main Campus$/, "");
}

/**
 * The interactive layer of the Pioneer map. `children` is the server-rendered basemap.
 * - Spikes rise when the map scrolls into view.
 * - A lens follows the mouse and pushes crowded spikes apart (fisheye), so dense regions stay readable.
 * - Pinch, Cmd/Ctrl + scroll, double-click or the region buttons zoom; drag pans. Zoomed in, every spike gets a name.
 * - Hover or focus names the university. Click opens its shortlist.
 */
export default function PioneerSpikes({
  width,
  height,
  top,
  spikes,
  heights,
  labels,
  children,
}: {
  width: number;
  height: number;
  top: number;
  spikes: Spike[];
  heights: number[];
  labels: { wide: SpikeLabel[]; narrow: SpikeLabel[] };
  children: React.ReactNode;
}) {
  const W = width;
  const H = height + top;
  const ref = useRef<HTMLDivElement>(null);
  const zp = useZoomPan(W, H);
  // "idle" draws everything, so the map is complete without JavaScript and for reduced motion.
  const [state, setState] = useState<"idle" | "armed" | "in">("idle");
  const [active, setActive] = useState<number | null>(null);
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);
  const [lensOk, setLensOk] = useState(false);
  const [region, setRegion] = useState<string | null>(null);
  const raf = useRef(0);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setLensOk(fine && !calm);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return; // already on screen: leave it drawn
    setState("armed");
    const io = new IntersectionObserver(
      (e) => {
        if (e.some((x) => x.isIntersecting)) {
          setState("in");
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Region boxes in viewBox units, from the spikes in each region (including their height).
  const boxes = useMemo(() => {
    const out: Record<string, [number, number, number, number]> = {};
    for (const r of REGIONS) {
      const pts = spikes.map((s, i) => ({ s, h: heights[i] })).filter(({ s }) => r.states.includes(s.state));
      if (!pts.length) continue;
      const pad = 24;
      out[r.key] = [
        Math.min(...pts.map((p) => p.s.x)) - pad,
        Math.min(...pts.map((p) => p.s.y - p.h)) + top - pad,
        Math.max(...pts.map((p) => p.s.x)) + pad,
        Math.max(...pts.map((p) => p.s.y)) + top + pad,
      ];
    }
    return out;
  }, [spikes, heights, top]);

  const { k, x: tx, y: ty } = useTween(zp.k, zp.x, zp.y, zp.dragging);
  const R = LENS / k;
  const mark = 1 / Math.pow(k, 0.85); // spike base stays near its screen size as the map grows
  const tall = 1 / Math.pow(k, 0.7);

  // Where each spike is drawn, after the lens.
  const drawn = useMemo(
    () =>
      spikes.map((s, i) => {
        let x = s.x;
        let y = s.y;
        let m = 1;
        if (lens) {
          const dx = s.x - lens.x;
          const dy = s.y - lens.y;
          const r = Math.hypot(dx, dy);
          if (r < R && r > 0.01) {
            const t = r / R;
            const nr = (R * (DISTORT + 1) * t) / (DISTORT * t + 1);
            x = lens.x + (dx / r) * nr;
            y = lens.y + (dy / r) * nr;
            m = 1 + 0.7 * (1 - t);
          } else if (r <= 0.01) m = 1.7;
        }
        return { x, y, half: HALF * mark * m, h: heights[i] * tall * m, m };
      }),
    [spikes, heights, lens, R, mark, tall]
  );

  function onMove(e: React.PointerEvent) {
    if (!lensOk || e.pointerType !== "mouse" || zp.dragging) return;
    const svg = zp.ref.current;
    if (!svg) return;
    const cx = e.clientX;
    const cy = e.clientY;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const r = svg.getBoundingClientRect();
      const vx = ((cx - r.left) / r.width) * W;
      const vy = ((cy - r.top) / r.height) * H;
      setLens({ x: (vx - tx) / k, y: (vy - ty) / k - top });
    });
  }

  const a = active != null ? spikes[active] : null;
  const ad = active != null ? drawn[active] : null;
  // Tooltip anchor in percent of the map box, after zoom and lens.
  const tipX = ad ? ((ad.x * k + tx) / W) * 100 : 0;
  const tipY = ad ? (((ad.y - ad.h + top) * k + ty) / H) * 100 : 0;

  const zoomedIn = k >= 2;

  // Zoomed-in labels: biggest counts first, skip any that would overlap one already placed.
  const placed = useMemo(() => {
    if (!zoomedIn) return [] as number[];
    const order = spikes.map((s, i) => i).sort((a, b) => spikes[b].n - spikes[a].n);
    const boxes: [number, number, number, number][] = [];
    const keep: number[] = [];
    for (const i of order) {
      const txt = `${shortUni(spikes[i].name)} ${spikes[i].n}`;
      const w = (txt.length * 6.3 + 4) / k;
      const h = 14 / k;
      const cx = drawn[i].x;
      const cy = drawn[i].y + 9 / k;
      const b: [number, number, number, number] = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
      if (boxes.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1])) continue;
      boxes.push(b);
      keep.push(i);
    }
    return keep;
  }, [zoomedIn, spikes, drawn, k]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseLeave={() => {
        setActive(null);
        setLens(null);
      }}
    >
      <div className="absolute left-0 top-0 z-10 flex flex-wrap gap-1.5 text-[12px] font-semibold">
        {[{ key: "all", label: "All" }, ...REGIONS].map((r) => {
          const on = (region ?? "all") === r.key;
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => {
                setRegion(r.key === "all" ? null : r.key);
                if (r.key === "all") zp.reset();
                else if (boxes[r.key]) zp.fit(boxes[r.key]);
              }}
              className={`h-7 px-2.5 rounded-[2px] border ${on ? "bg-ink text-paper border-ink" : "bg-surface/90 text-ink-2 border-rule hover:text-ink hover:border-ink-3"}`}
              aria-pressed={on}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      <svg
        ref={zp.ref}
        viewBox={`0 0 ${W} ${H}`}
        className="spikes block w-full h-auto"
        data-state={state}
        role="group"
        aria-label="Map of the United States. One spike per university. Spike height shows potential Pioneer team leads."
        style={zp.svgStyle}
        onPointerMove={onMove}
        onPointerLeave={() => setLens(null)}
        onPointerDown={() => setLens(null)}
      >
        <g transform={`translate(${tx} ${ty}) scale(${k})`}>
          <g transform={`translate(0 ${top})`}>
            {children}
            {lens && (
              <circle
                cx={lens.x}
                cy={lens.y}
                r={R}
                fill="var(--surface)"
                fillOpacity={0.35}
                stroke="var(--ink-3)"
                strokeOpacity={0.6}
                strokeDasharray="3 4"
                vectorEffect="non-scaling-stroke"
                style={{ pointerEvents: "none" }}
              />
            )}
            <g>
              {spikes.map((s, i) => {
                const d = drawn[i];
                const c = s.teal ? "var(--teal)" : "var(--accent)";
                const on = active === i;
                return (
                  <Link
                    key={s.id}
                    href={`/people?uni=${s.id}`}
                    aria-label={`${s.name}: ${s.n} potential Pioneer team ${s.n === 1 ? "lead" : "leads"}. Open the shortlist.`}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    onClick={(e) => {
                      if (zp.moved.current) e.preventDefault();
                    }}
                    className="outline-none"
                  >
                    <path
                      className="spike"
                      d={`M${d.x - d.half} ${d.y}L${d.x} ${d.y - d.h}L${d.x + d.half} ${d.y}Z`}
                      fill={c}
                      fillOpacity={on ? 0.95 : active == null ? (d.m > 1.05 ? 0.8 : 0.6) : 0.35}
                      stroke={on ? "var(--ink)" : c}
                      strokeWidth={on ? 1.5 : 1}
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      style={{ ["--d" as string]: `${Math.round((s.x / width) * 900)}ms` }}
                    />
                    {/* a wider, invisible target */}
                    <path
                      d={`M${d.x - d.half - 5 * mark} ${d.y + 4 * mark}L${d.x - 5 * mark} ${d.y - d.h - 4 * mark}L${d.x + 5 * mark} ${d.y - d.h - 4 * mark}L${d.x + d.half + 5 * mark} ${d.y + 4 * mark}Z`}
                      fill="transparent"
                    />
                  </Link>
                );
              })}
            </g>
            {zoomedIn ? (
              <g className="spike-labels" aria-hidden style={{ pointerEvents: "none" }}>
                {placed.map((i) => {
                  const s = spikes[i];
                  return (
                    <text
                      key={s.id}
                      x={drawn[i].x}
                      y={drawn[i].y + 13 / k}
                      textAnchor="middle"
                      fontSize={11 / k}
                      fontWeight={700}
                      fill="var(--ink)"
                      stroke="var(--paper)"
                      strokeWidth={3 / k}
                      strokeLinejoin="round"
                      paintOrder="stroke"
                      style={{ fontFamily: "var(--font-open-sans)" }}
                    >
                      {shortUni(s.name)} <tspan fill={s.teal ? "var(--teal)" : "var(--accent)"}>{s.n}</tspan>
                    </text>
                  );
                })}
              </g>
            ) : (
              <>
                <g className="spike-labels hidden sm:block" aria-hidden style={{ pointerEvents: "none" }}>
                  {labels.wide.map((l) => (
                    <Label key={l.id} l={l} size={15 / k} faded={!!lens && Math.hypot(l.x - lens.x, l.y - lens.y) < R * 1.1} />
                  ))}
                </g>
                <g className="spike-labels sm:hidden" aria-hidden style={{ pointerEvents: "none" }}>
                  {labels.narrow.map((l) => (
                    <Label key={l.id} l={l} size={30 / k} />
                  ))}
                </g>
              </>
            )}
          </g>
        </g>
      </svg>

      <ZoomControls zp={zp} />

      {a && ad && (
        <div
          role="status"
          className="absolute z-10 pointer-events-none w-max max-w-[220px] bg-surface border border-rule rounded-[4px] px-3 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.14)]"
          style={{
            left: `${tipX}%`,
            top: `${tipY}%`,
            transform: `translate(${tipX > 72 ? "calc(-100% - 10px)" : tipX < 28 ? "10px" : "-50%"}, ${tipX > 72 || tipX < 28 ? "-50%" : "calc(-100% - 10px)"})`,
          }}
        >
          <div className="text-[14px] leading-5 font-semibold">{a.name}</div>
          <div className="mt-0.5 text-[13px] leading-5 text-ink-2">
            <b className={`font-bold tnum ${a.teal ? "text-teal" : "text-accent"}`}>{a.n}</b> potential team {a.n === 1 ? "lead" : "leads"}
            {a.teal && <span className="text-ink-3"> · HBCU or EPSCoR</span>}
          </div>
          <div className="text-[12px] leading-5 text-ink-3">Click for the shortlist</div>
        </div>
      )}

      <p className="mt-2 hidden sm:block text-[12px] leading-5 text-ink-3">
        Move the mouse to magnify crowded areas. Pick a region, double-click, or pinch to zoom. Drag to move.
      </p>
      <p className="mt-2 sm:hidden text-[12px] leading-5 text-ink-3">Pick a region or pinch to zoom.</p>
    </div>
  );
}

/** Eases the drawn zoom toward the target so region jumps and button zooms glide. Drags and pinches follow at once. */
function useTween(k: number, x: number, y: number, instant: boolean) {
  const [v, setV] = useState({ k, x, y });
  const cur = useRef(v);
  useEffect(() => {
    const from = cur.current;
    if (instant || window.matchMedia("(prefers-reduced-motion: reduce)").matches || (from.k === k && from.x === x && from.y === y)) {
      cur.current = { k, x, y };
      setV(cur.current);
      return;
    }
    const t0 = performance.now();
    const ms = 550;
    let id = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      // interpolate scale in log space so zooms feel even
      const kk = Math.exp(Math.log(from.k) + (Math.log(k) - Math.log(from.k)) * e);
      cur.current = { k: kk, x: from.x + (x - from.x) * e, y: from.y + (y - from.y) * e };
      setV(cur.current);
      if (p < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [k, x, y, instant]);
  return v;
}

function Label({ l, size, faded }: { l: SpikeLabel; size: number; faded?: boolean }) {
  return (
    <text
      x={l.x}
      y={l.y}
      textAnchor="middle"
      fontSize={size}
      fontWeight={700}
      fill="var(--ink)"
      stroke="var(--paper)"
      strokeWidth={size * 0.3}
      strokeLinejoin="round"
      paintOrder="stroke"
      opacity={faded ? 0.1 : 1}
      style={{ fontFamily: "var(--font-open-sans)", transition: "opacity 200ms ease-out" }}
    >
      {l.text} <tspan fontWeight={800} fill={l.teal ? "var(--teal)" : "var(--accent)"}>{l.n}</tspan>
    </text>
  );
}
