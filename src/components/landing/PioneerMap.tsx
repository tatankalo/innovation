import Link from "next/link";
import { num } from "@/lib/format";
import { getPioneerMap, MAP_H, MAP_TOP, MAP_W, spikeHeight } from "@/lib/landing";
import PioneerSpikes from "./PioneerSpikes";

/** Where the potential Pioneer team leads are: one spike per university, teal for HBCUs and EPSCoR states. */
export default function PioneerMap() {
  const { totals, land, shaded, borders, spikes, labels } = getPioneerMap();
  return (
    <section className="mt-20" aria-labelledby="pioneer-map">
      <p className="eyebrow mb-4">For VentureWell · Potential Pioneer team leads</p>
      <h2 id="pioneer-map" className="font-serif text-[32px] leading-[38px] sm:text-[44px] sm:leading-[50px] tracking-[-0.02em] max-w-[900px]">
        {num(totals.leads)} inventors could lead a Pioneer team.{" "}
        <em className="text-teal">{num(totals.msi)} are at HBCUs or in EPSCoR states.</em>
      </h2>
      <p className="mt-4 text-[17px] leading-7 text-ink-2 max-w-[66ch]">
        Each one holds an NSF award and a patent at the same university, with prototype-stage work. None has been through
        I-Corps. Every name comes with a public email and the award that qualifies them.
      </p>

      <div className="mt-8 grid lg:grid-cols-[minmax(0,1fr)_248px] gap-x-10 gap-y-8 items-start">
        <div className="min-w-0">
          <a href="#after-pioneer-map" className="sr-only focus:not-sr-only text-[13px] text-accent underline">Skip the map</a>
          <PioneerSpikes width={MAP_W} height={MAP_H} top={MAP_TOP} spikes={spikes} heights={spikes.map((s) => spikeHeight(s.n))} labels={labels}>
            <path d={land} fill="var(--viz-land)" />
            <path d={shaded} fill="color-mix(in srgb, var(--teal) 20%, var(--viz-land))" />
            <path d={borders} fill="none" stroke="var(--paper)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          </PioneerSpikes>
          <p id="after-pioneer-map" className="mt-2 text-[13px] leading-5 text-ink-3">
            {num(totals.universities)} universities with at least one lead. Select a spike to open its shortlist.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-x-6">
          <div className="border-t border-rule pt-4 pb-6">
            <div className="font-serif text-[44px] leading-none tracking-[-0.02em] tnum text-accent">{num(totals.leads)}</div>
            <p className="mt-2 text-[14px] leading-5 text-ink-2">NSF-funded inventors with a patent, prototype-stage work and no I-Corps award</p>
          </div>
          <div className="border-t border-rule pt-4 pb-6">
            <div className="font-serif text-[44px] leading-none tracking-[-0.02em] tnum text-teal">{num(totals.msi)}</div>
            <p className="mt-2 text-[14px] leading-5 text-ink-2">at HBCUs or in the {totals.epscorStates} EPSCoR states shaded on the map</p>
          </div>
          <ul className="col-span-2 lg:col-span-1 border-t border-rule pt-4 space-y-2 text-[13px] leading-5 text-ink-2">
            <li className="flex items-center gap-2.5">
              <svg width="14" height="22" viewBox="0 0 14 22" className="shrink-0" aria-hidden>
                <path d="M2 21L7 1L12 21Z" fill="var(--accent)" fillOpacity="0.6" stroke="var(--accent)" strokeLinejoin="round" />
              </svg>
              Spike height: leads at one university
            </li>
            <li className="flex items-center gap-2.5">
              <svg width="14" height="22" viewBox="0 0 14 22" className="shrink-0" aria-hidden>
                <path d="M2 21L7 1L12 21Z" fill="var(--teal)" fillOpacity="0.6" stroke="var(--teal)" strokeLinejoin="round" />
              </svg>
              HBCU, or in an EPSCoR state
            </li>
            <li className="flex items-center gap-2.5">
              <i className="w-[14px] h-[14px] shrink-0 rounded-[1px] border border-rule" style={{ background: "color-mix(in srgb, var(--teal) 20%, var(--viz-land))" }} aria-hidden />
              EPSCoR state
            </li>
          </ul>
          <div className="col-span-2 lg:col-span-1 mt-6 flex flex-wrap lg:flex-col gap-3">
            <Link href="/people" className="inline-flex items-center justify-center h-10 px-4 rounded-[2px] bg-ink text-paper text-[14px] font-medium hover:bg-accent">
              Recruiting shortlist →
            </Link>
            <Link href="/venturewell" className="inline-flex items-center justify-center h-10 px-4 rounded-[2px] border border-rule hover:border-ink text-[14px] font-medium">
              See the program map
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
