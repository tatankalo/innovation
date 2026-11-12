import Link from "next/link";
import { SectionLabel } from "@/components/ui";
import { FigureRow, usd } from "@/components/vw/Charts";
import PrintButton from "@/components/vw/PrintButton";
import { date, num } from "@/lib/format";
import { getOverview, getReport, type UniRow, uniLabel } from "@/lib/vw";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "For VentureWell · Unshelved",
  description: "NSF-funded researchers and university patents mapped to VentureWell programs: I-Corps, E-Teams, funder accelerators and IUCRC.",
};

export default async function ForVentureWell() {
  const [{ data: o, refreshed_at }, { data: climate }, { data: ag }, { data: health }, { data: ocean }] = await Promise.all([
    getOverview(),
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

  const programs = [
    {
      name: "NSF I-Corps",
      n: o.ready,
      unit: "researchers ready",
      body: `Funded by NSF, named on a patent at the same university, prototype-stage work, and no I-Corps award yet. ${num(o.ready_recent)} have an NSF award that started in 2023 or later.`,
      href: "/people",
      cta: "Open the I-Corps shortlist",
    },
    {
      name: "E-Team grants and faculty programs",
      n: o.early,
      unit: "early movers",
      body: "Near-market NSF work with no patent filed yet. The PI is the faculty champion who can put a student team forward before the IP is locked in.",
      href: "/people?seg=early",
      cta: "Open the early movers",
    },
    {
      name: "Alumni and mentors",
      n: o.alumni,
      unit: "I-Corps alumni with patents",
      body: "Researchers who went through I-Corps and hold patents. Candidates for mentors, showcase speakers and follow-on programs.",
      href: "/people?seg=alumni",
      cta: "Open the alumni list",
    },
    {
      name: "NSF POSE and open source",
      n: o.oss_people ?? 0,
      unit: "open-source project leads",
      body: `PIs and co-PIs on ${num(o.oss_awards ?? 0)} NSF awards that build or maintain open-source software, hardware, data or models. Candidates for open-source ecosystem training.`,
      href: "/people?topic=opensource&seg=all",
      cta: "Open the open-source list",
    },
  ];

  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-8 pt-12">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <p className="label">For VentureWell</p>
        <PrintButton />
      </div>
      <h1 className="font-serif text-[40px] leading-[44px] sm:text-[64px] sm:leading-[66px] tracking-[-0.02em] max-w-[960px]">
        Every NSF-funded inventor, <em className="text-ink-2">matched to the program that fits.</em>
      </h1>
      <p className="mt-6 text-[19px] leading-8 text-ink-2 max-w-[680px]">
        Funders ask VentureWell for teams in their topic. Today those teams come from the newsletter, LinkedIn and the
        schools we already know. Unshelved reads every NSF award and university patent since 2021 and hands back a
        shortlist of named people, with contact details, sorted by how close their work is to market.
      </p>

      <div className="mt-12">
        <FigureRow
          items={[
            { n: num(o.people), label: "NSF researchers", sub: `PIs and co-PIs at ${num(o.universities)} universities, with public emails` },
            { n: num(o.inventor_pis), label: "Are also inventors", sub: "Named on a patent at the same university" },
            { n: num(o.ready), label: "Ready for I-Corps", sub: "Inventor, prototype stage, no I-Corps award yet", accent: true },
            { n: num(o.msi_ready), label: "Of them at HBCUs or in EPSCoR states", sub: "Reach beyond the usual network" },
          ]}
        />
      </div>

      <section className="mt-20">
        <SectionLabel right="Each list exports to CSV">Program fit</SectionLabel>
        <div className="grid md:grid-cols-2 gap-x-14">
          {programs.map((p) => (
            <article key={p.name} className="py-8 border-b border-rule break-inside-avoid">
              <h3 className="label mb-4">{p.name}</h3>
              <p className="font-serif text-[44px] leading-none tracking-[-0.02em] tnum">
                {num(p.n)} <span className="text-[20px] text-ink-2 tracking-normal">{p.unit}</span>
              </p>
              <p className="mt-4 text-[15px] leading-6 text-ink-2 max-w-[52ch]">{p.body}</p>
              <p className="mt-5 flex gap-5 text-[14px] font-medium no-print">
                <Link href={p.href} className="text-accent hover:underline underline-offset-4">{p.cta} →</Link>
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-20 break-inside-avoid">
        <SectionLabel right="One printable page per funder topic">Funder briefs</SectionLabel>
        <p className="-mt-2 mb-2 text-[15px] leading-6 text-ink-2 max-w-[70ch]">
          When a funder asks for teams in a topic, open the brief: funding, top universities and the people ready to recruit.
        </p>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10">
          {briefs.map((b) => (
            <li key={b.href} className="border-b border-rule">
              <Link href={b.href} className="group block py-6">
                <span className="label">{b.label}</span>
                <span className="mt-3 block font-serif text-[40px] leading-none tracking-[-0.02em] tnum group-hover:text-accent">{num(b.n)}</span>
                <span className="mt-2 block text-[14px] font-medium">ready for I-Corps</span>
                <span className="mt-1 block text-[13px] text-ink-3">{b.fit}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-20 break-inside-avoid">
        <SectionLabel right="I-Corps awards since 2021 at or below 3">Where the pipeline outruns I-Corps</SectionLabel>
        <p className="-mt-2 mb-6 text-[15px] leading-6 text-ink-2 max-w-[70ch]">
          These schools have many NSF-funded inventors with prototype-stage work and almost no NSF I-Corps awards. They
          are the first places to recruit. {num(o.unis_ready_no_icorps)} schools with ready researchers have no I-Corps award at all.
        </p>
        <UniTable
          rows={o.untapped}
          cols={[
            ["Ready for I-Corps", (u) => num(u.ready_people), true],
            ["Climate", (u) => (u.ready_climate ? num(u.ready_climate) : "")],
            ["Ag tech", (u) => (u.ready_agtech ? num(u.ready_agtech) : "")],
            ["NSF research awards", (u) => num(u.research_awards ?? 0)],
            ["I-Corps awards", (u) => num(u.icorps_awards)],
          ]}
        />
      </section>

      <section className="mt-20 break-inside-avoid">
        <SectionLabel right={`${num(o.hbcu_unis)} HBCUs and ${num(o.epscor_unis)} EPSCoR schools in the data`}>Reach: HBCUs and EPSCoR states</SectionLabel>
        <p className="-mt-2 mb-6 text-[15px] leading-6 text-ink-2 max-w-[70ch]">
          {num(o.msi_ready)} ready researchers sit at HBCUs or in EPSCoR states, where NSF wants more commercialization.{" "}
          <Link href="/people?msi=1" className="text-accent hover:underline underline-offset-4 no-print">See all of them →</Link>
        </p>
        <UniTable
          rows={o.msi}
          cols={[
            ["Ready for I-Corps", (u) => num(u.ready_people), true],
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
          are ready for I-Corps. Industry members already fund these labs, so they are natural partners for funder challenges.
        </p>
        <UniTable
          rows={o.iucrc}
          cols={[
            ["IUCRC awards", (u) => num(u.iucrc_awards ?? 0)],
            ["IUCRC $", (u) => usd(u.iucrc_dollars ?? 0)],
            ["Ready for I-Corps", (u) => (u.ready_people ? num(u.ready_people) : ""), true],
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
          Data refreshed {date(refreshed_at.slice(0, 10))}.
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
