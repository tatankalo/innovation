"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import pipeline from "@/data/landing-pipeline.json";
import { num } from "@/lib/format";

/**
 * Landing hero: the NSF pipeline as a flow, with the two leaks VentureWell's programs can catch,
 * and a what-if panel for Pioneer's reach. All numbers come from landing-pipeline.json.
 */

type Filter = (typeof pipeline.filters)[number];
/** researchers, inventors, inventors through I-Corps, of those tied to a startup */
type Counts = [number, number, number, number];

const FILTERS = pipeline.filters;
const ALL = FILTERS.find((f) => f.key === "all") ?? FILTERS[0];
const STAGES = pipeline.stages;
const [PIONEER, ALUMNI] = pipeline.leaks;
const GOAL = pipeline.goals.innovators;
const SMALL = 30;

const GROUPS: { label: string; groups: string[] }[] = [
  { label: "Schools", groups: ["scope", "type"] },
  { label: "Access", groups: ["access"] },
  { label: "Sector", groups: ["sector"] },
];
const BASE_NAMES = ["", "researchers", "inventors", "I-Corps inventors"];
const STAGE_HREF: (string | null)[] = [null, null, null, "/startups"];
const LEAK_LINKS = [
  { leak: PIONEER, href: "/people", cta: "Open the shortlist", color: "var(--brick)" },
  { leak: ALUMNI, href: "/people?seg=alumni", cta: "See the alumni", color: "var(--teal)" },
];

const countsOf = (f: Filter): Counts => [f.researchers, f.inventors, f.inv_icorps, f.inv_icorps_startup];

function pct(part: number, base: number) {
  if (base <= 0) return "0%";
  const p = (part / base) * 100;
  if (p > 0 && p < 0.1) return "Under 0.1%";
  return `${p >= 10 || p === 0 ? Math.round(p) : p.toFixed(1)}%`;
}

// ---------------------------------------------------------------- Geometry

const W = 1056;
const H = 406;
/** Top edge of the flow. Stage labels sit above it. */
const Y0 = 128;
const T_MAX = 150;
const T_MIN = 4;
const XS = [0, 270, 540, 810];
const SEG = 130;
const R = 24;
const Y_ARROW = 250;

const FLOW_LIGHT = "color-mix(in srgb, var(--ink) 13%, var(--paper))";
const FLOW_MID = "color-mix(in srgb, var(--ink) 34%, var(--paper))";

/** Band thickness on a square-root scale, relative to the researchers in view. Never thicker than the stage before. */
function thicknesses(c: Counts) {
  const out: number[] = [];
  c.forEach((n, i) => {
    const t = n <= 0 || c[0] <= 0 ? 0 : Math.max(T_MIN, T_MAX * Math.sqrt(n / c[0]));
    out.push(i ? Math.min(out[i - 1], t) : t);
  });
  return out;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** The part that drops out: leaves the band at xa, turns a quarter circle and falls to an arrowhead. */
function leakPath(xa: number, top: number, w: number) {
  if (w <= 0) return "";
  const cy = top + w + R;
  const ya = Math.max(Y_ARROW, cy + 8);
  const xo = xa + R + w;
  const head = 12 + w * 0.25;
  return [
    `M${xa},${r1(top)}`,
    `A${r1(R + w)},${r1(R + w)} 0 0 1 ${r1(xo)},${r1(cy)}`,
    `V${r1(ya)}H${r1(xo + 7)}`,
    `L${r1(xa + R + w / 2)},${r1(ya + head)}`,
    `L${xa + R - 7},${r1(ya)}H${xa + R}V${r1(cy)}`,
    `A${R},${R} 0 0 0 ${xa},${r1(top + w)}Z`,
  ].join("");
}

// ---------------------------------------------------------------- Component

export default function PipelineHero() {
  const [activeKey, setActiveKey] = useState(ALL.key);
  const [shown, setShown] = useState<Counts>(() => countsOf(ALL));
  const [reach, setReach] = useState(10);
  const [teamSize, setTeamSize] = useState(4);
  const shownRef = useRef<Counts>(shown);
  const raf = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const active = FILTERS.find((f) => f.key === activeKey) ?? ALL;
  const target = countsOf(active);

  function select(f: Filter) {
    if (f.key === activeKey) return;
    setActiveKey(f.key);
    cancelAnimationFrame(raf.current);
    const from = shownRef.current;
    const to = countsOf(f);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      shownRef.current = to;
      setShown(to);
      return;
    }
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / 500);
      const e = 1 - Math.pow(1 - p, 3);
      const next = (p === 1 ? to : from.map((v, i) => v + (to[i] - v) * e)) as Counts;
      shownRef.current = next;
      setShown(next);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }

  // Displayed (tweened) counts. Leaks are differences of the rounded stage counts so the sums always add up.
  const c = shown.map(Math.round) as Counts;
  const leakN = [c[1] - c[2], c[2] - c[3]];
  const t = thicknesses(shown);
  const leakW = [leakN[0] > 0 ? Math.max(3, t[1] - t[2]) : 0, leakN[1] > 0 ? Math.max(3, t[2] - t[3]) : 0];

  // Rates use the settled numbers, not the tween.
  const rates = target.map((n, i) =>
    i === 0 ? null : { text: `${pct(n, target[i - 1])} of ${BASE_NAMES[i]}`, small: target[i - 1] < SMALL }
  );

  // What-if
  const pool = active.inventors - active.inv_icorps;
  const teams = Math.round((pool * reach) / 100);
  const innovators = teams * teamSize;
  const goalShare = Math.min(1, innovators / GOAL);
  const ownRate = active.inv_icorps >= SMALL;
  const rateFrom = ownRate ? active : ALL;
  const startups = (teams * rateFrom.inv_icorps_startup) / rateFrom.inv_icorps;
  const startupsText = startups > 0 && startups < 0.1 ? "< 0.1" : startups > 0 && startups < 10 ? startups.toFixed(1) : num(Math.round(startups));

  const leakXa = [XS[1] + SEG, XS[2] + SEG];
  const leakTop = [Y0 + t[2], Y0 + t[3]];

  return (
    <section className="pt-12 sm:pt-16" aria-labelledby="pipeline-hero">
      <p className="eyebrow mb-4">For VentureWell · NSF pipeline</p>
      <h1 id="pipeline-hero" className="font-serif text-[36px] leading-[40px] sm:text-[56px] sm:leading-[60px] tracking-[-0.025em] max-w-[940px]">
        NSF has already paid for the research. <em className="text-brick sm:block">Here is where it leaks out.</em>
      </h1>
      <p className="mt-5 text-[18px] leading-7 text-ink-2 max-w-[62ch]">
        Follow {num(ALL.researchers)} NSF-funded researchers toward a startup. Most inventors drop out at two points, and
        VentureWell has a program for each.
      </p>

      {/* Filters */}
      <div className="no-print mt-8 flex flex-wrap gap-x-8 gap-y-3">
        {GROUPS.map((g) => (
          <div key={g.label} role="group" aria-label={g.label} className="flex flex-wrap items-center gap-1.5">
            <span className="label mr-1.5">{g.label}</span>
            {FILTERS.filter((f) => g.groups.includes(f.group)).map((f) => {
              const on = f.key === activeKey;
              return (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => select(f)}
                  className={`h-9 px-3 rounded-[2px] border text-[14px] font-semibold cursor-pointer ${
                    on ? "bg-ink text-paper border-ink" : "border-rule text-ink-2 hover:border-ink hover:text-ink"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className="hidden print:block mt-6 text-[14px] font-semibold">Showing: {active.label}</p>

      {/* Text alternative for the wide diagram. The stacked version below is already plain text. */}
      <div className="sr-only max-lg:hidden">
        <p>Pipeline for {active.label}:</p>
        <ol>
          {STAGES.map((s, i) => (
            <li key={s.key}>
              {s.label}: {num(target[i])}
              {rates[i] ? `, ${rates[i].text}${rates[i].small ? " (small sample)" : ""}` : ""}
            </li>
          ))}
        </ol>
        <p>
          {PIONEER.label}: {num(target[1] - target[2])}. {PIONEER.body}. {ALUMNI.label}: {num(target[2] - target[3])}. {ALUMNI.body}.
        </p>
      </div>

      {/* Wide: the flow diagram */}
      <svg viewBox={`0 0 ${W} ${H}`} className="hidden lg:block mt-8 w-full h-auto overflow-visible" role="group" aria-label="Pipeline flow diagram">
        {/* Researchers, narrowing to inventors. Not a leak: most researchers never patent. */}
        <path
          aria-hidden
          fill={FLOW_LIGHT}
          d={`M0,${Y0}H${XS[1]}V${r1(Y0 + t[1])}C${XS[1] - 70},${r1(Y0 + t[1])} ${SEG + 70},${r1(Y0 + t[0])} ${SEG},${r1(Y0 + t[0])}H0Z`}
        />
        <rect aria-hidden x={XS[1]} y={Y0} width={SEG} height={r1(t[1])} fill={FLOW_MID} />
        <rect aria-hidden x={leakXa[0]} y={Y0} width={leakXa[1] - leakXa[0]} height={r1(t[2])} fill={FLOW_MID} />

        {/* Stage labels */}
        {STAGES.map((s, i) => {
          const href = STAGE_HREF[i];
          const label = (
            <g aria-hidden={href ? undefined : true}>
              <text x={XS[i]} y={52} fontSize={46} fontWeight={800} letterSpacing="-0.02em" fill={i === 3 ? "var(--accent)" : "var(--ink)"} className="tnum">
                {num(c[i])}
              </text>
              <text x={XS[i]} y={80} fontSize={16} fontWeight={700} fill="var(--ink)">
                {s.label}
              </text>
              {rates[i] && (
                <text x={XS[i]} y={103} fontSize={14} fill="var(--ink-2)">
                  <tspan fillOpacity={rates[i].small ? 0.45 : 1}>{rates[i].text}</tspan>
                  {rates[i].small && <tspan fontWeight={700}> · small sample</tspan>}
                </text>
              )}
              {i === 0 && (
                <text x={XS[i]} y={103} fontSize={14} fill="var(--ink-2)">
                  NSF awards 2021 to 2026
                </text>
              )}
            </g>
          );
          return href ? (
            <Link key={s.key} href={href} aria-label={`${s.label}: ${num(target[i])}. See the startups.`} className="group">
              <rect x={leakXa[1]} y={8} width={W - leakXa[1]} height={Y0 + 40} fill="transparent" />
              {label}
              {c[3] > 0 ? (
                <path
                  fill="var(--accent)"
                  d={`M${leakXa[1]},${Y0}H${W - 20}V${Y0 - 5}L${W},${r1(Y0 + t[3] / 2)}L${W - 20},${r1(Y0 + t[3] + 5)}V${r1(Y0 + t[3])}H${leakXa[1]}Z`}
                />
              ) : (
                <path d={`M${leakXa[1]},${Y0 + 1}H${W}`} stroke="var(--ink-3)" strokeWidth={1.5} strokeDasharray="4 5" />
              )}
              <text x={XS[i]} y={Y0 + 34} fontSize={14} fontWeight={700} fill="var(--accent)" className="group-hover:underline">
                See the startups →
              </text>
            </Link>
          ) : (
            <g key={s.key}>{label}</g>
          );
        })}

        {/* The leaks */}
        {LEAK_LINKS.map((l, i) => {
          const x = leakXa[i] + R - 7;
          return (
            <Link
              key={l.leak.program}
              href={l.href}
              aria-label={`${l.leak.label}: ${num(target[i + 1] - target[i + 2])}. ${l.leak.body}. ${l.cta}.`}
              className="group"
            >
              <rect x={leakXa[i]} y={Y0 + 44} width={i === 0 ? leakXa[1] - leakXa[0] - 8 : W - leakXa[1]} height={H - Y0 - 44} fill="transparent" />
              <path d={leakPath(leakXa[i], leakTop[i], leakW[i])} fill={l.color} />
              <text x={x} y={332} fontSize={46} fontWeight={800} letterSpacing="-0.02em" fill={l.color} className="tnum">
                {num(leakN[i])}
              </text>
              <text x={x} y={357} fontSize={17} fontWeight={800} fill="var(--ink)">
                {l.leak.label}
              </text>
              <text x={x} y={378} fontSize={14} fill="var(--ink-2)">
                {l.leak.body}
              </text>
              <text x={x} y={400} fontSize={14} fontWeight={700} fill={l.color} className="group-hover:underline">
                {l.cta} →
              </text>
            </Link>
          );
        })}
      </svg>

      {/* Narrow and print: the same flow, stacked */}
      <div className="lg:hidden mt-8">
        {STAGES.map((s, i) => {
          const href = STAGE_HREF[i];
          const leak = i >= 2 ? LEAK_LINKS[i - 2] : null;
          return (
            <div key={s.key}>
              {leak && (
                <Link
                  href={leak.href}
                  className="group block ml-4 my-3 pl-4 pr-3 py-3 border-l-[6px] rounded-[2px] break-inside-avoid"
                  style={{ borderColor: leak.color, background: `color-mix(in srgb, ${leak.color} 9%, var(--paper))` }}
                >
                  <span className="flex items-baseline gap-x-3 flex-wrap">
                    <span className="display tnum text-[34px] leading-none" style={{ color: leak.color }}>
                      {num(leakN[i - 2])}
                    </span>
                    <span className="text-[16px] font-extrabold">{leak.leak.label}</span>
                  </span>
                  <span className="mt-1 block text-[14px] leading-5 text-ink-2">{leak.leak.body}</span>
                  <span className="mt-1 block text-[14px] font-bold group-hover:underline" style={{ color: leak.color }}>
                    {leak.cta} →
                  </span>
                </Link>
              )}
              <div className="py-3 break-inside-avoid">
                <div className="flex items-baseline gap-x-3 flex-wrap">
                  <span className={`display tnum text-[34px] leading-none ${i === 3 ? "text-accent" : ""}`}>{num(c[i])}</span>
                  <span className="text-[15px] font-bold">{s.label}</span>
                </div>
                <div className="mt-2 h-3" aria-hidden>
                  {c[i] > 0 ? (
                    <div
                      className="h-full rounded-[1px]"
                      style={{ width: `${r1(Math.max(1.5, (t[i] / T_MAX) * 100))}%`, background: i === 3 ? "var(--accent)" : i === 0 ? FLOW_LIGHT : FLOW_MID }}
                    />
                  ) : (
                    <div className="w-10 border-t-2 border-dashed border-ink-3" />
                  )}
                </div>
                {rates[i] && (
                  <p className="mt-1.5 text-[13px] leading-5 text-ink-2">
                    <span className={rates[i].small ? "opacity-45" : ""}>{rates[i].text}</span>
                    {rates[i].small && <span className="font-bold"> · small sample</span>}
                  </p>
                )}
                {href && (
                  <Link href={href} className="mt-1 inline-block text-[14px] font-bold text-accent hover:underline">
                    See the startups →
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* What if */}
      <div className="mt-10 border border-rule bg-surface rounded-[2px] p-5 sm:p-7 break-inside-avoid">
        <h2 className="label">What if Pioneer reached more of them?</h2>
        <div className="mt-4 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-x-12 gap-y-8">
          <div>
            <label htmlFor="pioneer-reach" className="block text-[18px] leading-7 font-semibold">
              Pioneer reaches <span className="display tnum text-[26px] text-brick">{reach}%</span> of inventors who have not been through
              I-Corps
            </label>
            <input
              id="pioneer-reach"
              type="range"
              min={0}
              max={50}
              step={1}
              value={reach}
              onChange={(e) => setReach(Number(e.target.value))}
              aria-valuetext={`${reach} percent`}
              className="no-print mt-3 w-full h-8 cursor-pointer"
              style={{ accentColor: "var(--brick)" }}
            />
            <div className="no-print flex justify-between text-[12px] text-ink-3 tnum" aria-hidden>
              <span>0%</span>
              <span>50%</span>
            </div>
            <p className="mt-2 text-[14px] leading-5 text-ink-2">
              That pool is {num(pool)} inventors. Filter: {active.label}.
            </p>

            <div role="group" aria-labelledby="team-size-label" className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span id="team-size-label" className="text-[15px] font-semibold">
                Innovators per team <span className="font-normal text-ink-3">(an assumption)</span>
              </span>
              <span className="no-print flex gap-1.5">
                {[3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={n === teamSize}
                    aria-label={`${n} innovators per team`}
                    onClick={() => setTeamSize(n)}
                    className={`w-10 h-9 rounded-[2px] border text-[15px] font-bold tnum cursor-pointer ${
                      n === teamSize ? "bg-ink text-paper border-ink" : "border-rule text-ink-2 hover:border-ink hover:text-ink"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </span>
              <span className="hidden print:inline text-[15px] font-bold tnum">{teamSize}</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-x-8 gap-y-6" aria-live="polite">
            <div className="border-t-2 border-brick pt-3">
              <div className="display tnum text-[44px] leading-none">{num(teams)}</div>
              <p className="mt-2 text-[15px] leading-5 font-semibold">new Pioneer teams</p>
            </div>
            <div className="border-t-2 border-ink pt-3">
              <div className="display tnum text-[44px] leading-none">{num(innovators)}</div>
              <p className="mt-2 text-[15px] leading-5 font-semibold">innovators reached</p>
              <div
                role="progressbar"
                aria-label={`Share of the ${num(GOAL)} innovator goal`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(goalShare * 100)}
                className="mt-3 h-2.5 rounded-[1px] bg-panel overflow-hidden"
              >
                <div className="h-full bg-accent" style={{ width: `${r1(goalShare * 100)}%` }} />
              </div>
              <p className="mt-1.5 text-[13px] leading-5 text-ink-2">
                {pct(innovators, GOAL)} of the {num(GOAL)} goal by {pipeline.goals.year}
              </p>
            </div>
            <div className="border-t-2 border-accent pt-3">
              <div className="display tnum text-[44px] leading-none text-accent">{startupsText}</div>
              <p className="mt-2 text-[15px] leading-5 font-semibold">expected startups at today&rsquo;s rate</p>
              <p className="mt-1.5 text-[13px] leading-5 text-ink-2">
                {ownRate
                  ? `Today ${num(rateFrom.inv_icorps_startup)} of ${num(rateFrom.inv_icorps)} I-Corps inventors are tied to a startup.`
                  : "Too few I-Corps inventors here, so using the all-university rate."}
              </p>
            </div>
          </div>
        </div>
        <p className="mt-6 pt-4 border-t border-rule text-[13px] leading-5 text-ink-3">Scenario using today&rsquo;s measured rates. Not a forecast.</p>
      </div>

      <p className="mt-4 text-[13px] leading-5 text-ink-3">
        People are matched to patents and startups by name, so counts are estimates. NSF awards 2021 to 2026.{" "}
        <Link href="/pipeline" className="font-semibold text-accent hover:underline underline-offset-4 whitespace-nowrap">
          See the full analysis →
        </Link>
      </p>
    </section>
  );
}
