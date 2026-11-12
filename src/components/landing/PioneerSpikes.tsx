"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Spike, SpikeLabel } from "@/lib/landing";

const HALF = 4; // half the spike base, in map units

/**
 * The interactive layer of the Pioneer map. `children` is the server-rendered basemap.
 * Spikes rise when the map scrolls into view. Hover or focus names the university. Click opens its shortlist.
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
  const ref = useRef<HTMLDivElement>(null);
  // "idle" draws everything, so the map is complete without JavaScript and for reduced motion.
  const [state, setState] = useState<"idle" | "armed" | "in">("idle");
  const [active, setActive] = useState<number | null>(null);

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

  const a = active != null ? spikes[active] : null;
  const aH = active != null ? heights[active] : 0;

  return (
    <div ref={ref} className="relative" onMouseLeave={() => setActive(null)}>
      <svg
        viewBox={`0 ${-top} ${width} ${height + top}`}
        className="spikes block w-full h-auto"
        data-state={state}
        role="group"
        aria-label="Map of the United States. One spike per university. Spike height shows potential Pioneer team leads."
      >
        {children}
        <g>
          {spikes.map((s, i) => {
            const h = heights[i];
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
                className="outline-none"
              >
                <path
                  className="spike"
                  d={`M${s.x - HALF} ${s.y}L${s.x} ${s.y - h}L${s.x + HALF} ${s.y}Z`}
                  fill={c}
                  fillOpacity={on ? 0.95 : active == null ? 0.6 : 0.35}
                  stroke={on ? "var(--ink)" : c}
                  strokeWidth={on ? 1.5 : 1}
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  style={{ ["--d" as string]: `${Math.round((s.x / width) * 900)}ms` }}
                />
                {/* a wider, invisible target */}
                <path d={`M${s.x - 9} ${s.y + 4}L${s.x - 5} ${s.y - h - 4}L${s.x + 5} ${s.y - h - 4}L${s.x + 9} ${s.y + 4}Z`} fill="transparent" />
              </Link>
            );
          })}
        </g>
        <g className="spike-labels hidden sm:block" aria-hidden style={{ pointerEvents: "none" }}>
          {labels.wide.map((l) => (
            <Label key={l.id} l={l} size={15} />
          ))}
        </g>
        <g className="spike-labels sm:hidden" aria-hidden style={{ pointerEvents: "none" }}>
          {labels.narrow.map((l) => (
            <Label key={l.id} l={l} size={30} />
          ))}
        </g>
      </svg>
      {a && (
        <div
          role="status"
          className="absolute z-10 pointer-events-none w-max max-w-[220px] bg-surface border border-rule rounded-[4px] px-3 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.14)]"
          style={{
            left: `${(a.x / width) * 100}%`,
            top: `${((a.y - aH + top) / (height + top)) * 100}%`,
            transform: `translate(${a.x > width * 0.72 ? "calc(-100% - 10px)" : a.x < width * 0.28 ? "10px" : "-50%"}, ${a.x > width * 0.72 || a.x < width * 0.28 ? "-50%" : "calc(-100% - 10px)"})`,
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
    </div>
  );
}

function Label({ l, size }: { l: SpikeLabel; size: number }) {
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
      style={{ fontFamily: "var(--font-open-sans)" }}
    >
      {l.text} <tspan fontWeight={800} fill={l.teal ? "var(--teal)" : "var(--accent)"}>{l.n}</tspan>
    </text>
  );
}
