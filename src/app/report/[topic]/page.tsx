import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionLabel } from "@/components/ui";
import { BarList, Columns, FigureRow, ReadinessSplit, usd } from "@/components/vw/Charts";
import PeopleTable from "@/components/vw/PeopleTable";
import PrintButton from "@/components/vw/PrintButton";
import { date, num } from "@/lib/format";
import { getReport, getShortlist, pct, TOPICS, type Topic, uniLabel, VW_SUBS } from "@/lib/vw";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const t = TOPICS[topic as Topic];
  return t ? { title: `${t.label} funder brief · Unshelved`, description: t.funderLine } : {};
}

export default async function ReportPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  if (!(topic in TOPICS)) notFound();
  const t = topic as Topic;
  const meta = TOPICS[t];
  const [{ data: r, refreshed_at }, short] = await Promise.all([getReport(t), getShortlist({ topic: t, seg: "ready", lim: 12 })]);
  const T = r.totals;
  const years = r.by_year.filter((y) => y.yr >= 2021);
  const subs = r.subs.map((s) => ({ ...s, label: VW_SUBS[t][s.sub] ?? s.sub }));
  const lensHref = `/?l=${t}&o=readiness`;
  const hasPatents = T.patents > 0;

  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-8 pt-12 report">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <p className="label">Funder brief · {meta.label} · {meta.program}</p>
        <div className="flex gap-3 no-print">
          <a href={`/api/people?topic=${t}&seg=ready`} download className="inline-flex items-center gap-2 h-9 px-4 rounded-[2px] border border-rule hover:border-ink text-[14px] font-medium">
            Shortlist CSV
          </a>
          <PrintButton />
        </div>
      </div>
      <h1 className="font-serif text-[40px] leading-[44px] sm:text-[60px] sm:leading-[62px] tracking-[-0.02em] max-w-[900px]">
        {meta.long} <em className="text-ink-2">in US university labs.</em>
      </h1>
      <p className="mt-5 text-[18px] leading-8 text-ink-2 max-w-[660px]">
        {meta.funderLine} NSF has put {usd(T.dollars)} into {num(T.awards)} {meta.label.toLowerCase()} awards since 2021. We
        found {num(T.ready)} researchers who already hold a patent and have no NSF I-Corps award.
      </p>

      <div className="mt-12">
        <FigureRow
          items={[
            { n: num(T.awards), label: "NSF awards", sub: `${usd(T.dollars)} since 2021` },
            hasPatents
              ? { n: num(T.patents), label: "Patented inventions", sub: "University patent families" }
              : { n: num(T.people), label: "Researchers", sub: "NSF PIs and co-PIs in this topic" },
            { n: num(T.universities), label: "Universities", sub: "With an award or a patent in this topic" },
            { n: num(T.ready), label: "Potential Pioneer teams", sub: "Inventor, prototype stage, no I-Corps award yet", accent: true },
          ]}
        />
      </div>

      <section className="mt-16 grid md:grid-cols-2 gap-x-14 gap-y-14 break-inside-avoid">
        <div>
          <SectionLabel right="NSF dollars by start year">Funding</SectionLabel>
          <Columns data={years.map((y) => ({ label: String(y.yr), value: y.dollars }))} color={meta.color} format={usd} partialLast />
          <p className="mt-3 text-[13px] text-ink-3">2026 is year to date (hatched).</p>
        </div>
        {hasPatents ? (
          <div>
            <SectionLabel right="Patent families by first publication">Patents</SectionLabel>
            <Columns data={years.map((y) => ({ label: String(y.yr), value: y.patents }))} color={meta.color} partialLast />
            <p className="mt-3 text-[13px] text-ink-3">Recent years fill in as applications publish (18 months after filing).</p>
          </div>
        ) : (
          <div>
            <SectionLabel right="NSF awards by start year">Awards</SectionLabel>
            <Columns data={years.map((y) => ({ label: String(y.yr), value: y.awards }))} color={meta.color} partialLast />
            <p className="mt-3 text-[13px] text-ink-3">{meta.patentNote}</p>
          </div>
        )}
        <div>
          <SectionLabel right={hasPatents && meta.lens ? "Awards plus patents" : "NSF awards"}>Where the work is</SectionLabel>
          <BarList
            rows={subs.map((s) => ({ label: s.label, value: s.awards + s.patents, note: usd(s.dollars), tip: `${s.label}: ${num(s.awards)} awards (${usd(s.dollars)}), ${num(s.patents)} patents` }))}
            color={meta.color}
          />
        </div>
        <div>
          <SectionLabel right={hasPatents ? "Awards plus patents" : "NSF awards"}>How close to market</SectionLabel>
          <ReadinessSplit counts={r.readiness} color={meta.color} />
          <p className="mt-5 text-[14px] leading-6 text-ink-2 max-w-[52ch]">
            {num((r.readiness[2] ?? 0) + (r.readiness[3] ?? 0))} records ({pct((r.readiness[2] ?? 0) + (r.readiness[3] ?? 0), r.readiness.reduce((a, b) => a + b, 0))}%) describe a prototype
            or a product near market. Those are the teams a commercialization program can move fastest.
          </p>
        </div>
      </section>

      <section className="mt-16 break-inside-avoid">
        <SectionLabel right={hasPatents ? "Ranked by awards plus patents" : "Ranked by awards"}>Top universities</SectionLabel>
        <div className="overflow-x-auto">
          <table className="w-full text-[15px] min-w-[680px]">
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="label py-3 font-semibold">University</th>
                <th className="label py-3 font-semibold text-right">Awards</th>
                <th className="label py-3 font-semibold text-right">NSF $</th>
                {hasPatents && <th className="label py-3 font-semibold text-right">Patents</th>}
                <th className="label py-3 font-semibold text-right">Pioneer teams</th>
                <th className="label py-3 font-semibold text-right">I-Corps awards</th>
              </tr>
            </thead>
            <tbody>
              {r.top_unis.map((u) => (
                <tr key={u.id} className="border-b border-rule">
                  <td className="py-3 pr-4">
                    <Link href={`/university/${u.id}`} className="hover:text-accent">{uniLabel(u.name)}</Link>
                    <span className="ml-2 font-mono text-[12px] text-ink-3">{u.state}{u.epscor ? " · EPSCoR" : ""}{u.hbcu ? " · HBCU" : ""}</span>
                  </td>
                  <td className="py-3 text-right font-mono text-[13px] tnum">{num(u.awards)}</td>
                  <td className="py-3 text-right font-mono text-[13px] tnum">{usd(u.dollars)}</td>
                  {hasPatents && <td className="py-3 text-right font-mono text-[13px] tnum">{num(u.patents)}</td>}
                  <td className="py-3 text-right font-mono text-[13px] tnum text-accent">{u.ready ? num(u.ready) : ""}</td>
                  <td className="py-3 text-right font-mono text-[13px] tnum text-ink-3">{u.icorps_awards ? num(u.icorps_awards) : "0"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-16">
        <SectionLabel right={<Link href={`/people?topic=${t}`} className="hover:text-accent no-print">All {num(short.total)} on the shortlist →</Link>}>
          Recruiting shortlist: potential Pioneer teams
        </SectionLabel>
        <p className="-mt-2 mb-6 text-[14px] text-ink-2 max-w-[68ch]">
          NSF-funded PIs and co-PIs in {meta.label.toLowerCase()} who are named inventors at the same university, with
          prototype-stage work and no NSF I-Corps award since 2021. {num(T.msi_ready)} are at HBCUs or in EPSCoR states.
        </p>
        <PeopleTable rows={short.rows} />
      </section>

      <section className="mt-16 text-[13px] leading-6 text-ink-3 max-w-[76ch] break-inside-avoid">
        <SectionLabel>Method</SectionLabel>
        <p>
          Sources: NSF award data (research, I-Corps, IUCRC, SBIR, STTR) and university patents from Google Patents Public
          Datasets, since 2021. Topic and readiness tags come from a language model reading each abstract. A person is
          a potential Pioneer team lead when an NSF PI or co-PI name matches a patent inventor at the same university, their
          best award reads as prototype stage or later, and they hold no NSF I-Corps award in this data. A name match
          shows the same person, not that the award produced the patent. Data refreshed {date(refreshed_at.slice(0, 10))}.
        </p>
        {meta.patentNote && hasPatents && <p className="mt-3">{meta.patentNote}</p>}
        {meta.lens && <p className="mt-3 no-print">
          Explore the records behind this brief in the <Link href={lensHref} className="underline decoration-rule underline-offset-4 hover:text-ink">{meta.label.toLowerCase()} lens</Link>.
        </p>}
      </section>
    </div>
  );
}
