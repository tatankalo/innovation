import Link from "next/link";
import Explorer from "@/components/pipeline/Explorer";
import { SectionLabel } from "@/components/ui";
import PrintButton from "@/components/vw/PrintButton";
import { date, money, num } from "@/lib/format";
import { getPipeline, STAGES, total } from "@/lib/pipeline";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "NSF pipeline · Unshelved",
  description: "Where NSF-funded research drops off on the way to market: papers, patents, I-Corps and SBIR/STTR startups by institution type, EPSCoR, HBCU status, region and sector.",
};

const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : "–");

export default async function PipelinePage() {
  const { data: p, refreshed_at } = await getPipeline();
  const all = total(p.universities);
  const r1 = total(p.universities.filter((u) => u.grp === "R1"));
  const rest = total(p.universities.filter((u) => u.grp !== "R1"));
  const notYet = all.inventors - all.inventors_icorps;
  const restNotYet = rest.inventors - rest.inventors_icorps;

  const chain = [
    { n: all.pubs, unit: "journal articles", sub: `OpenAlex, ${p.pubs_years}` },
    { n: all.families, unit: "patent families", sub: `${num(all.inventors)} NSF-funded inventors` },
    { n: all.icorps, unit: "I-Corps teams", sub: `${num(all.inventors_icorps)} inventors took part` },
    { n: all.startups, unit: "SBIR/STTR startups", sub: `tied to ${num(all.startup_people)} researchers` },
  ];

  const groupsBy = (sector: string) => p.sector_groups.filter((g) => g.sector === sector);
  const sectors = p.sectors.map((s) => {
    const g = groupsBy(s.sector);
    const sum = (k: "awards" | "icorps" | "startups" | "dollars" | "families", f: (grp: string) => boolean) =>
      g.filter((x) => f(x.grp)).reduce((a, x) => a + Number(x[k] ?? 0), 0);
    return {
      ...s,
      dollars: sum("dollars", () => true),
      startups: sum("startups", () => true),
      nonR1Awards: pct(sum("awards", (x) => x !== "R1"), sum("awards", () => true)),
      nonR1Icorps: pct(sum("icorps", (x) => x !== "R1"), sum("icorps", () => true)),
      icorpsPer100: s.awards ? ((100 * s.icorps) / s.awards).toFixed(1) : "–",
    };
  });

  const r1Rate = STAGES[2].rate(r1);
  const restRate = STAGES[2].rate(rest);
  const r1Start = STAGES[3].rate(r1);
  const restStart = STAGES[3].rate(rest);

  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-8 pt-12 pb-24">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <p className="eyebrow">For VentureWell development · NSF pipeline analysis</p>
        <PrintButton />
      </div>
      <h1 className="font-serif text-[40px] leading-[44px] sm:text-[60px] sm:leading-[64px] max-w-[980px]">
        NSF already paid for the research. <em className="text-ink-2">Here is where it stops short of the market.</em>
      </h1>
      <p className="mt-6 text-[19px] leading-8 text-ink-2 max-w-[720px]">
        Journal articles, patents, I-Corps teams and SBIR/STTR startups at {num(all.n)} universities with NSF research awards since 2021.
        Cut them by institution type, EPSCoR, HBCU status, land-grant status, region or sector to find the handoff where good
        ideas stall.
      </p>

      <section className="mt-12 bg-panel rounded-[2px] grid sm:grid-cols-2 lg:grid-cols-4 break-inside-avoid">
        {chain.map((c, i) => (
          <div key={c.unit} className={`p-6 sm:p-7 ${i ? "border-t sm:border-t-0 sm:border-l border-rule" : ""}`}>
            <p className="label">Stage {i + 1}</p>
            <p className="mt-3 font-serif text-[40px] sm:text-[44px] leading-none tnum">{num(c.n)}</p>
            <p className="mt-2 text-[15px] font-semibold">{c.unit}</p>
            <p className="mt-1 text-[13px] text-ink-3">{c.sub}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 grid md:grid-cols-2 gap-6 break-inside-avoid">
        <article className="border border-rule bg-surface p-7">
          <p className="label">Pitch 1 · Double down</p>
          <p className="mt-4 font-serif text-[48px] leading-none tnum text-brick">{num(notYet)}</p>
          <p className="mt-3 text-[15px] leading-6">
            NSF-funded researchers already hold a university patent and have never been through I-Corps. NSF has paid for the
            research and the university has paid for the patent. A Pioneer-style program reaches them next.
          </p>
          <p className="mt-3 text-[14px] leading-6 text-ink-2">
            {num(restNotYet)} of them work outside R1 universities. There, inventors who reach I-Corps
            {restRate != null && r1Rate != null ? ` (${restRate.toFixed(0)}% against ${r1Rate.toFixed(0)}% at R1s)` : ""} turn it into
            a startup less often: {r1Start != null && restStart != null ? `${restStart.toFixed(1)} SBIR/STTR startups per 10 I-Corps teams against ${r1Start.toFixed(1)} at R1s` : "fewer startups follow"}.
            The gap after I-Corps is where Propel and Aspire fit.
          </p>
          <p className="mt-5 text-[14px] font-semibold no-print">
            <Link href="/people" className="text-accent hover:underline underline-offset-4">Open the named list →</Link>
          </p>
        </article>
        <article className="border border-rule bg-surface p-7">
          <p className="label">Pitch 2 · Diagnose first</p>
          <p className="mt-4 font-serif text-[48px] leading-none tnum text-teal">{num(all.n)}</p>
          <p className="mt-3 text-[15px] leading-6">
            universities, each with a measured drop-off point. A funded workshop brings the institutions with the steepest drop-offs
            together to find out why, then proposes a program that fits.
          </p>
          <p className="mt-3 text-[14px] leading-6 text-ink-2">
            Use the shaded cells below to pick the groups and the handoff to study first.
          </p>
        </article>
      </section>

      <section className="mt-20">
        <SectionLabel right="Rates make groups of different size comparable">Where each group drops off</SectionLabel>
        <Explorer unis={p.universities} />
      </section>

      <section className="mt-20 break-inside-avoid">
        <SectionLabel right="Keyword and patent-class tags">Strategic sectors</SectionLabel>
        <p className="-mt-2 mb-5 text-[15px] leading-6 text-ink-2 max-w-[75ch]">
          The same pipeline for five priority areas. Awards are tagged from their titles and abstracts, patents from their CPC
          classes. Treat these as first-pass tags: the next step is a second AI model checking a sample.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-[14px] border-collapse">
            <thead>
              <tr className="text-left text-[12px] uppercase tracking-[0.06em] text-ink-3 align-bottom">
                <th className="py-2 pr-3 font-semibold">Sector</th>
                <th className="py-2 px-2 font-semibold text-right">NSF research awards</th>
                <th className="py-2 px-2 font-semibold text-right">Dollars</th>
                <th className="py-2 px-2 font-semibold text-right">Patent families</th>
                <th className="py-2 px-2 font-semibold text-right">I-Corps teams</th>
                <th className="py-2 px-2 font-semibold text-right">I-Corps per 100 awards</th>
                <th className="py-2 px-2 font-semibold text-right">NSF SBIR/STTR awards</th>
                <th className="py-2 px-2 font-semibold text-right">Linked startups</th>
                <th className="py-2 pl-2 font-semibold text-right">Outside R1: awards / I-Corps</th>
              </tr>
            </thead>
            <tbody>
              {sectors.map((s) => (
                <tr key={s.sector} className="border-t border-rule">
                  <td className="py-2.5 pr-3 font-semibold">{s.label}</td>
                  <td className="py-2.5 px-2 text-right tnum">{num(s.awards)}</td>
                  <td className="py-2.5 px-2 text-right tnum">{money(s.dollars)}</td>
                  <td className="py-2.5 px-2 text-right tnum">{num(s.families)}</td>
                  <td className="py-2.5 px-2 text-right tnum">{num(s.icorps)}</td>
                  <td className="py-2.5 px-2 text-right tnum font-semibold">{s.icorpsPer100}</td>
                  <td className="py-2.5 px-2 text-right tnum">{num(s.sbir)}</td>
                  <td className="py-2.5 px-2 text-right tnum">{num(s.startups)}</td>
                  <td className="py-2.5 pl-2 text-right tnum">
                    {s.nonR1Awards} / {s.nonR1Icorps}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] text-ink-3 max-w-[90ch]">
          SBIR/STTR counts are national NSF awards in the sector. Linked startups are the subset tied to a researcher at one of
          these universities. One award can sit in more than one sector.
        </p>
      </section>

      <section className="mt-20 break-inside-avoid">
        <SectionLabel>How to read this, and what it can&apos;t say yet</SectionLabel>
        <ul className="grid md:grid-cols-2 gap-x-10 gap-y-4 text-[14px] leading-6 text-ink-2">
          <li>
            <span className="font-semibold text-ink">Unit of analysis.</span> Universities, grouped by type. No person-level race or
            gender inference.
          </li>
          <li>
            <span className="font-semibold text-ink">Coverage.</span> The {num(all.n)} universities that hold NSF research awards in
            Unshelved, mostly R1 and R2 ({num(r1.n)} R1). Smaller institutions with few awards are under-counted, so non-R1 rates are
            the least stable.
          </li>
          <li>
            <span className="font-semibold text-ink">Institution type.</span> Carnegie 2025 research designations: R1, R2 and Research
            college or university. &ldquo;Other&rdquo; has no research designation.
          </li>
          <li>
            <span className="font-semibold text-ink">Papers.</span> OpenAlex journal articles with an author at the university, {p.pubs_years}.
            Campuses that share one OpenAlex record count once.
          </li>
          <li>
            <span className="font-semibold text-ink">People.</span> Researchers are NSF PIs and co-PIs. Inventors are matched to patents
            by name at the same university, so counts are estimates. Some universities file patents under a system or foundation
            name (University of California campuses, Pittsburgh, Northwestern), which lowers their patent counts.
          </li>
          <li>
            <span className="font-semibold text-ink">Startups.</span> NSF SBIR/STTR companies whose PI matches an inventor or NSF PI at
            a university in the same state. NSF only; other agencies&apos; SBIR awards are not loaded yet.
          </li>
        </ul>
        <p className="mt-6 text-[12px] text-ink-3">
          Sources: NSF Award Search, Google Patents Public Datasets, OpenAlex, Carnegie Classification 2025. Built {date(refreshed_at)}.
        </p>
      </section>
    </div>
  );
}
