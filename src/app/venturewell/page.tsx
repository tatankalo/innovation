import Link from "next/link";
import { SectionLabel } from "@/components/ui";
import { usd } from "@/components/vw/Charts";
import PrintButton from "@/components/vw/PrintButton";
import { date, num } from "@/lib/format";
import { getOverview, getReport, getStrategy, type UniRow, uniLabel } from "@/lib/vw";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "For VentureWell · Unshelved",
  description: "NSF-funded researchers, inventors and IUCRC students mapped to VentureWell's Five-Year Strategy: Pioneer, Propel and Aspire, and the 30,000 innovators goal.",
};

export default async function ForVentureWell() {
  const [{ data: o, refreshed_at }, { data: s }, { data: climate }, { data: ag }, { data: health }, { data: ocean }] = await Promise.all([
    getOverview(),
    getStrategy(),
    getReport("climate"),
    getReport("agtech"),
    getReport("health"),
    getReport("ocean"),
  ]);
  const briefs = [
    { href: "/report/climate", label: "Climate", n: climate.totals.ready, fit: "Aspire Climatetech" },
    { href: "/report/health", label: "Health", n: health.totals.ready, fit: "Aspire Medtech, RADx, Blueprint" },
    { href: "/report/ocean", label: "Ocean", n: ocean.totals.ready, fit: "Ocean Enterprise Accelerator" },
    { href: "/report/agtech", label: "Ag tech", n: ag.totals.ready, fit: "Moonshots for Development" },
  ];
  const innovators = s.innovator_inventors + s.innovator_authors;

  const path = [
    {
      step: "Pioneer",
      offer: "$5,000 and a workshop for a new E-Team",
      lists: [
        { n: o.ready, unit: "potential Pioneer team leads", body: "NSF-funded faculty named on a patent at the same university, with prototype-stage work and no I-Corps award yet. Their students make up the team.", href: "/people", cta: "Open the Pioneer shortlist" },
        { n: o.early, unit: "early movers", body: "Near-market NSF work with no patent filed yet. A fit for Pioneer with IP education, before the IP is locked in.", href: "/people?seg=early", cta: "Open the early movers" },
      ],
    },
    {
      step: "Propel",
      offer: "$20,000 and three months of training",
      lists: [
        { n: o.alumni, unit: "Propel candidates", body: "Researchers who went through I-Corps and hold patents. Trained teams with IP, ready for a bigger step. Also strong mentors and showcase speakers.", href: "/people?seg=alumni", cta: "Open the Propel candidates" },
      ],
    },
    {
      step: "Aspire",
      offer: "Investor readiness for startups",
      lists: [
        { n: s.sttr_partner_awards, unit: "STTR startup partnerships", body: `Small companies with NSF STTR awards that partner with ${num(s.sttr_unis)} universities in the data. University spinouts at the stage Aspire serves.`, href: "/?t=sttr", cta: "Search the STTR startups" },
      ],
    },
  ];

  const barriers = [
    {
      tag: "Process",
      color: "text-brick",
      n: num(s.inventors_no_icorps),
      body: "NSF-funded inventors hold university patents but have no I-Corps award. This is underutilized IP with a named faculty owner.",
      strategy: "3.5% of university invention disclosures since 1996 became a startup (AUTM).",
      href: "/people",
      cta: "Start with the Pioneer shortlist",
    },
    {
      tag: "Access",
      color: "text-accent",
      n: num(o.msi_ready),
      body: "potential Pioneer team leads work at HBCUs or in EPSCoR states, outside the established innovation hubs.",
      strategy: "Inventors would quadruple if everyone invented at the rate of the most advantaged groups (Bell et al., 2018).",
      href: "/people?msi=1",
      cta: "See them",
    },
    {
      tag: "Capacity",
      color: "text-teal",
      n: `${s.top20_fam_pct}%`,
      body: `of university patent families come from the top 20% of ${num(s.unis)} universities. The same schools hold ${s.top20_dollars_pct}% of NSF research dollars.`,
      strategy: "About 20% of institutions produce 60% of commercialization (Weis et al., 2018).",
      href: "/universities",
      cta: "Compare universities",
    },
  ];

  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-8 pt-12">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <p className="eyebrow">For VentureWell · Five-Year Strategy 2026–2031</p>
        <PrintButton />
      </div>
      <h1 className="font-serif text-[40px] leading-[44px] sm:text-[60px] sm:leading-[64px] max-w-[960px]">
        Find the next 30,000 innovators, <em className="text-ink-2">and the catalysts who back them.</em>
      </h1>
      <p className="mt-6 text-[19px] leading-8 text-ink-2 max-w-[700px]">
        VentureWell&apos;s strategy commits to activating 30,000 innovators and connecting 10,000 catalysts by 2031.
        Unshelved reads every NSF award, university patent and IUCRC paper since 2021. It names the people behind them
        and the step on the Pioneer, Propel and Aspire path that fits each one.
      </p>

      <section className="mt-12 bg-panel rounded-[2px] grid md:grid-cols-2 break-inside-avoid">
        <div className="p-7 sm:p-9">
          <p className="eyebrow">Innovators</p>
          <p className="mt-4 font-serif text-[52px] sm:text-[64px] leading-none tnum">{num(innovators)}</p>
          <p className="mt-3 text-[15px] font-semibold">Potential innovators in the data. The 2031 goal is 30,000.</p>
          <ul className="mt-4 space-y-1.5 text-[15px] leading-6 text-ink-2">
            <li><span className="font-semibold text-ink tnum">{num(s.innovator_inventors)}</span> university patent inventors who are not NSF PIs</li>
            <li><span className="font-semibold text-ink tnum">{num(s.innovator_authors)}</span> IUCRC paper co-authors, mostly graduate students and postdocs</li>
          </ul>
          <p className="mt-5 flex gap-5 text-[14px] font-semibold no-print">
            <Link href="/centers" className="text-accent hover:underline underline-offset-4">IUCRC centers →</Link>
            <Link href="/?t=patent" className="text-accent hover:underline underline-offset-4">Patents →</Link>
          </p>
        </div>
        <div className="p-7 sm:p-9 border-t md:border-t-0 md:border-l border-rule">
          <p className="eyebrow !text-teal">Catalysts</p>
          <p className="mt-4 font-serif text-[52px] sm:text-[64px] leading-none tnum">{num(s.catalysts)}</p>
          <p className="mt-3 text-[15px] font-semibold">NSF-funded faculty with public emails. The 2031 goal is 10,000.</p>
          <ul className="mt-4 space-y-1.5 text-[15px] leading-6 text-ink-2">
            <li>PIs and co-PIs at <span className="font-semibold text-ink tnum">{num(o.universities)}</span> universities who can advise E-Teams</li>
            <li><span className="font-semibold text-ink tnum">{num(s.catalyst_inventors)}</span> of them are inventors themselves, natural mentors</li>
          </ul>
          <p className="mt-5 flex gap-5 text-[14px] font-semibold no-print">
            <Link href="/people?seg=all" className="text-teal hover:underline underline-offset-4">All faculty →</Link>
          </p>
        </div>
      </section>
      <p className="mt-3 text-[13px] text-ink-3 max-w-[90ch]">
        Counts match people by name, so they are estimates. Inventors and co-authors come without emails; faculty come with the
        public email on their NSF award.
      </p>

      <section className="mt-20">
        <SectionLabel right="Each list exports to CSV">The Pioneer → Propel → Aspire path</SectionLabel>
        <ol className="grid lg:grid-cols-3 gap-x-10">
          {path.map((p, i) => (
            <li key={p.step} className="break-inside-avoid">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 grid place-items-center rounded-[2px] bg-[#d47a42] text-white text-[13px] font-extrabold">{i + 1}</span>
                <h3 className="display text-[26px] leading-none">{p.step}</h3>
              </div>
              <p className="mt-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-3">{p.offer}</p>
              {p.lists.map((l) => (
                <article key={l.unit} className="py-6 border-b border-rule">
                  <p className="font-serif text-[40px] leading-none tnum">
                    {num(l.n)} <span className="text-[17px] font-semibold text-ink-2 tracking-normal">{l.unit}</span>
                  </p>
                  <p className="mt-3 text-[15px] leading-6 text-ink-2">{l.body}</p>
                  <p className="mt-4 text-[14px] font-semibold no-print">
                    <Link href={l.href} className="text-accent hover:underline underline-offset-4">{l.cta} →</Link>
                  </p>
                </article>
              ))}
            </li>
          ))}
        </ol>
        <p className="mt-6 text-[15px] text-ink-2">
          Also: <Link href="/people?topic=opensource&seg=all" className="font-semibold text-accent hover:underline underline-offset-4">{num(o.oss_people ?? 0)} open-source project leads</Link>{" "}
          on {num(o.oss_awards ?? 0)} NSF awards, for NSF POSE and open-source ecosystem training.
        </p>
      </section>

      <section className="mt-20 break-inside-avoid">
        <SectionLabel right="Our data next to the strategy's evidence">Three barriers, measured</SectionLabel>
        <div className="grid md:grid-cols-3 border border-rule bg-surface">
          {barriers.map((b, i) => (
            <article key={b.tag} className={`p-7 flex flex-col ${i ? "border-t md:border-t-0 md:border-l border-rule" : ""}`}>
              <p className="label">{b.tag}</p>
              <p className={`mt-4 font-serif text-[52px] leading-none tnum ${b.color}`}>{b.n}</p>
              <p className="mt-4 text-[15px] leading-6">{b.body}</p>
              <p className="mt-4 text-[13px] leading-5 text-ink-3 flex-1">
                <span className="font-semibold text-ink-2">Strategy: </span>
                {b.strategy}
              </p>
              <p className="mt-5 text-[14px] font-semibold no-print">
                <Link href={b.href} className="text-accent hover:underline underline-offset-4">{b.cta} →</Link>
              </p>
            </article>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-ink-3">
          Sources: Unshelved, from NSF awards and Google Patents Public Datasets since 2021. Strategy figures from VentureWell
          Five-Year Strategy 2026–2031.
        </p>
      </section>

      <section className="mt-20 break-inside-avoid">
        <SectionLabel right="One printable page per funder topic">Funder briefs · Catalyze solutions</SectionLabel>
        <p className="-mt-2 mb-2 text-[15px] leading-6 text-ink-2 max-w-[70ch]">
          When a funder asks for teams in a topic, open the brief: funding, top universities and the people ready to recruit.
        </p>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10">
          {briefs.map((b) => (
            <li key={b.href} className="border-b border-rule">
              <Link href={b.href} className="group block py-6">
                <span className="label">{b.label}</span>
                <span className="mt-3 block font-serif text-[40px] leading-none tracking-[-0.02em] tnum group-hover:text-accent">{num(b.n)}</span>
                <span className="mt-2 block text-[14px] font-semibold">potential Pioneer teams</span>
                <span className="mt-1 block text-[13px] text-ink-3">{b.fit}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-20 break-inside-avoid">
        <SectionLabel right="I-Corps awards since 2021 at or below 3">Capacity: where talent outruns support</SectionLabel>
        <p className="-mt-2 mb-6 text-[15px] leading-6 text-ink-2 max-w-[70ch]">
          These schools have many NSF-funded inventors with prototype-stage work and almost no NSF I-Corps awards. They
          are the first places to recruit Pioneer teams and to build campus capacity. {num(o.unis_ready_no_icorps)} schools with potential Pioneer teams have no I-Corps award at all.
        </p>
        <UniTable
          rows={o.untapped}
          cols={[
            ["Pioneer teams", (u) => num(u.ready_people), true],
            ["Climate", (u) => (u.ready_climate ? num(u.ready_climate) : "")],
            ["Ag tech", (u) => (u.ready_agtech ? num(u.ready_agtech) : "")],
            ["NSF research awards", (u) => num(u.research_awards ?? 0)],
            ["I-Corps awards", (u) => num(u.icorps_awards)],
          ]}
        />
      </section>

      <section className="mt-20 break-inside-avoid">
        <SectionLabel right={`${num(o.hbcu_unis)} HBCUs and ${num(o.epscor_unis)} EPSCoR schools in the data`}>Access: HBCUs and EPSCoR states</SectionLabel>
        <p className="-mt-2 mb-6 text-[15px] leading-6 text-ink-2 max-w-[70ch]">
          {num(o.msi_ready)} potential Pioneer team leads sit at HBCUs or in EPSCoR states, where NSF wants more commercialization.{" "}
          <Link href="/people?msi=1" className="text-accent hover:underline underline-offset-4 no-print">See all of them →</Link>
        </p>
        <UniTable
          rows={o.msi}
          cols={[
            ["Pioneer teams", (u) => num(u.ready_people), true],
            ["NSF research awards", (u) => num(u.research_awards ?? 0)],
            ["Patents", (u) => num(u.families)],
            ["I-Corps awards", (u) => num(u.icorps_awards)],
          ]}
        />
      </section>

      <section className="mt-20 break-inside-avoid">
        <SectionLabel right={`${num(o.iucrc_awards)} IUCRC awards · ${usd(o.iucrc_dollars)} at ${num(o.iucrc_unis)} universities`}>IUCRC sites</SectionLabel>
        <p className="-mt-2 mb-6 text-[15px] leading-6 text-ink-2 max-w-[70ch]">
          Universities that host NSF Industry-University Cooperative Research Centers, with the inventors at each site who
          could lead Pioneer teams. Industry members already fund these labs, so they are natural partners for funder challenges.
        </p>
        <UniTable
          rows={o.iucrc}
          cols={[
            ["IUCRC awards", (u) => num(u.iucrc_awards ?? 0)],
            ["IUCRC $", (u) => usd(u.iucrc_dollars ?? 0)],
            ["Pioneer teams", (u) => (u.ready_people ? num(u.ready_people) : ""), true],
            ["I-Corps awards", (u) => num(u.icorps_awards)],
          ]}
        />
      </section>

      <section className="mt-20 text-[13px] leading-6 text-ink-3 max-w-[76ch]">
        <SectionLabel>How to read this</SectionLabel>
        <p>
          &ldquo;No I-Corps award&rdquo; means no NSF I-Corps award in NSF data since 2021. Someone may have joined a regional
          hub or a campus program that NSF data does not show. A person counts as an inventor when an NSF PI or co-PI name
          matches a patent inventor at the same university, which shows the same person, not that the award produced the
          patent. Readiness comes from a language model reading each abstract. Emails come from public NSF award records.
          Innovators and catalysts follow the strategy&apos;s definitions. Inventors who are not NSF PIs and IUCRC co-authors who are not site PIs count as innovators. NSF PIs and co-PIs count as catalysts. Data refreshed {date(refreshed_at.slice(0, 10))}.
        </p>
      </section>
    </div>
  );
}

function UniTable({ rows, cols }: { rows: UniRow[]; cols: [string, (u: UniRow) => string, boolean?][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[15px] min-w-[640px]">
        <thead>
          <tr className="border-b border-rule text-left">
            <th className="label py-3 font-semibold">University</th>
            {cols.map(([h]) => (
              <th key={h} className="label py-3 font-semibold text-right">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id} className="border-b border-rule">
              <td className="py-3 pr-4">
                <Link href={`/university/${u.id}`} className="hover:text-accent">{uniLabel(u.name)}</Link>
                <span className="ml-2 font-mono text-[12px] text-ink-3">
                  {u.state}
                  {u.epscor ? " · EPSCoR" : ""}
                  {u.hbcu ? " · HBCU" : ""}
                </span>
              </td>
              {cols.map(([h, f, accent]) => (
                <td key={h} className={`py-3 text-right font-mono text-[13px] tnum ${accent ? "text-accent" : ""}`}>{f(u)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
