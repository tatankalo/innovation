import Link from "next/link";
import { SectionLabel } from "@/components/ui";
import { BarList, Columns, FigureRow, usd } from "@/components/vw/Charts";
import PrintButton from "@/components/vw/PrintButton";
import WomensHealthRecords from "@/components/vw/WomensHealthRecords";
import { date, num } from "@/lib/format";
import { uniLabel } from "@/lib/vw";
import { getWomensHealth, HEALTH_IUCRCS, WH_ORDER, WH_THEMES } from "@/lib/womens-health";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Women's health landscape · Unshelved",
  description: "NSF-funded women's health research, I-Corps teams, SBIR/STTR companies and university patents since 2021, plus what the IUCRC centers do in health.",
};

const COLOR = "var(--viz-health_bio)";

export default async function WomensHealthPage() {
  const { data: r, refreshed_at } = await getWomensHealth();
  const T = r.totals;
  const themes = WH_ORDER.map((k) => ({ ...WH_THEMES[k], ...(r.themes.find((t) => t.theme === k) ?? { research: 0, icorps: 0, sbir: 0, dollars: 0, patents: 0 }) }));
  const g = r.groups;
  const uniAwards = Object.values(g).reduce((a, b) => a + b, 0);
  const r1 = g.R1 ?? 0;

  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-8 pt-12 pb-24 report">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <p className="label">Landscape · Women&apos;s health · NSF, 2021 to 2026</p>
        <div className="flex gap-3 no-print">
          <a href="/api/womens-health" download className="inline-flex items-center gap-2 h-9 px-4 rounded-[2px] border border-rule hover:border-ink text-[14px] font-medium">
            All records CSV
          </a>
          <PrintButton />
        </div>
      </div>
      <h1 className="font-serif text-[40px] leading-[44px] sm:text-[60px] sm:leading-[62px] tracking-[-0.02em] max-w-[940px]">
        Women&apos;s health <em className="text-ink-2">in NSF-funded labs.</em>
      </h1>
      <p className="mt-5 text-[18px] leading-8 text-ink-2 max-w-[700px]">
        NSF has put {usd(T.dollars)} into {num(T.awards)} women&apos;s health awards since 2021. That covers research, I-Corps
        teams and SBIR/STTR companies. Universities hold {num(T.patents)} patent families in the same space. No IUCRC center
        focuses on it.
      </p>

      <div className="mt-12">
        <FigureRow
          items={[
            { n: num(T.research), label: "Research awards", sub: `${usd(T.research_dollars)} to universities` },
            { n: num(T.icorps), label: "I-Corps teams", sub: "Tested a market with NSF" },
            { n: num(T.sbir), label: "SBIR/STTR awards", sub: `${usd(T.sbir_dollars)} to companies` },
            { n: num(T.patents), label: "Patent families", sub: `${num(T.universities)} universities with awards or patents`, accent: true },
          ]}
        />
      </div>

      <section className="mt-16 break-inside-avoid">
        <SectionLabel right="Awards and patents by theme">Where the work is</SectionLabel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[14px] border-collapse">
            <thead>
              <tr className="text-left text-[12px] uppercase tracking-[0.06em] text-ink-3 border-b border-rule">
                <th className="py-2 pr-3 font-semibold">Theme</th>
                <th className="py-2 px-2 font-semibold text-right">Research</th>
                <th className="py-2 px-2 font-semibold text-right">I-Corps</th>
                <th className="py-2 px-2 font-semibold text-right">SBIR/STTR</th>
                <th className="py-2 px-2 font-semibold text-right">NSF $</th>
                <th className="py-2 pl-2 font-semibold text-right">Patents</th>
              </tr>
            </thead>
            <tbody>
              {themes.map((t) => (
                <tr key={t.label} className="border-b border-rule align-top">
                  <td className="py-3 pr-3">
                    <span className="font-semibold">{t.label}</span>
                    <span className="block text-[12px] text-ink-3">{t.note}</span>
                  </td>
                  <td className="py-3 px-2 text-right tnum">{num(t.research)}</td>
                  <td className="py-3 px-2 text-right tnum">{num(t.icorps)}</td>
                  <td className="py-3 px-2 text-right tnum">{num(t.sbir)}</td>
                  <td className="py-3 px-2 text-right tnum">{usd(t.dollars)}</td>
                  <td className="py-3 pl-2 text-right tnum">{num(t.patents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-16 grid md:grid-cols-2 gap-x-14 gap-y-14 break-inside-avoid">
        <div>
          <SectionLabel right="NSF dollars by start year">Funding</SectionLabel>
          <Columns data={r.by_year.map((y) => ({ label: String(y.yr), value: y.dollars }))} color={COLOR} format={usd} partialLast />
          <p className="mt-3 text-[13px] text-ink-3">The last year is year to date (hatched).</p>
        </div>
        <div>
          <SectionLabel right="Research and I-Corps awards">Who gets the awards</SectionLabel>
          <BarList
            rows={["R1", "R2", "Research college", "Other"].filter((k) => g[k]).map((k) => ({ label: k === "Other" ? "Other or not classified" : k, value: g[k] }))}
            color={COLOR}
          />
          <p className="mt-4 text-[14px] leading-6 text-ink-2 max-w-[52ch]">
            {num(r1)} of {num(uniAwards)} awards went to R1 universities. Teams at R2 and smaller schools are almost absent.
            That is a gap VentureWell&apos;s programs could fill.
          </p>
        </div>
      </section>

      <section className="mt-16 grid md:grid-cols-2 gap-6 break-inside-avoid">
        <article className="border border-rule bg-surface p-7">
          <p className="label">Where VentureWell fits · Pioneer</p>
          <p className="mt-4 font-serif text-[48px] leading-none tnum text-brick">{num(T.inventors_no_icorps)}</p>
          <p className="mt-3 text-[15px] leading-6">
            of the {num(T.researchers)} researchers who lead a women&apos;s health NSF research award are named inventors and have
            never been through I-Corps. They are the first Pioneer invitations.
          </p>
        </article>
        <article className="border border-rule bg-surface p-7">
          <p className="label">Where VentureWell fits · Propel and Aspire</p>
          <p className="mt-4 font-serif text-[48px] leading-none tnum text-teal">{num(T.icorps + T.sbir)}</p>
          <p className="mt-3 text-[15px] leading-6">
            I-Corps teams and SBIR/STTR companies already working on women&apos;s health. They have tested a market or won
            federal funding. They are ready for an accelerator or a funder-sponsored cohort.
          </p>
        </article>
      </section>

      <section className="mt-16 break-inside-avoid">
        <SectionLabel right="Ranked by awards, then patents">Top universities</SectionLabel>
        <div className="overflow-x-auto">
          <table className="w-full text-[15px] min-w-[620px]">
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="label py-3 font-semibold">University</th>
                <th className="label py-3 font-semibold text-right">Awards</th>
                <th className="label py-3 font-semibold text-right">NSF $</th>
                <th className="label py-3 font-semibold text-right">I-Corps</th>
                <th className="label py-3 font-semibold text-right">Patents</th>
              </tr>
            </thead>
            <tbody>
              {r.top_unis.map((u) => (
                <tr key={u.id} className="border-b border-rule">
                  <td className="py-3 pr-4">
                    <Link href={`/university/${u.id}`} className="hover:text-accent">{uniLabel(u.name)}</Link>
                    <span className="ml-2 font-mono text-[12px] text-ink-3">{u.state}</span>
                  </td>
                  <td className="py-3 text-right font-mono text-[13px] tnum">{num(u.awards)}</td>
                  <td className="py-3 text-right font-mono text-[13px] tnum">{u.dollars ? usd(u.dollars) : ""}</td>
                  <td className="py-3 text-right font-mono text-[13px] tnum">{u.icorps ? num(u.icorps) : ""}</td>
                  <td className="py-3 text-right font-mono text-[13px] tnum">{num(u.patents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] text-ink-3 max-w-[80ch]">
          Patents filed under a university system name (University of California, University of Texas) are not credited to a
          single campus here. They stay in the patent list below.
        </p>
      </section>

      <section className="mt-16 break-inside-avoid">
        <SectionLabel right={`${HEALTH_IUCRCS.length} of 109 centers work on health`}>What the IUCRC centers do</SectionLabel>
        <p className="-mt-2 mb-5 text-[15px] leading-6 text-ink-2 max-w-[75ch]">
          These centers work on health. None of them focuses on women&apos;s health, and no center award names it. Only{" "}
          {num(r.iucrc_papers.length)} of 2,091 IUCRC papers touch the topic.
        </p>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2 text-[14px]">
          {HEALTH_IUCRCS.map(([k, d]) => (
            <li key={k} className="border-b border-rule py-2">
              <Link href={`/center/${k}`} className="font-semibold hover:text-accent">{k}</Link>
              <span className="text-ink-2"> · {d}</span>
            </li>
          ))}
        </ul>
        {r.iucrc_papers.length > 0 && (
          <ul className="mt-5 text-[14px] leading-6 text-ink-2 list-disc pl-5">
            {r.iucrc_papers.map((p) => (
              <li key={p.title}>
                {p.doi ? <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noreferrer" className="hover:text-accent">{p.title}</a> : p.title}{" "}
                <span className="text-ink-3">({p.centers.join(", ")}, {p.year})</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-16">
        <SectionLabel>The records</SectionLabel>
        <WomensHealthRecords awards={r.awards} patents={r.patents} people={r.people} />
      </section>

      <section className="mt-16 text-[13px] leading-6 text-ink-3 max-w-[78ch] break-inside-avoid">
        <SectionLabel>Method and limits</SectionLabel>
        <p>
          An award counts when its title names a women&apos;s health topic, its abstract names one three or more times, or a
          language model tagged it women&apos;s and maternal health. Topics include pregnancy, preeclampsia, postpartum care,
          breast, ovarian and cervical cancer, contraception, fertility, PCOS, endometriosis, menopause, lactation, newborn care,
          osteoporosis and sex differences. Patents count when their title names one. Title matches are reliable. About one in
          four abstract-only matches is off topic, so treat counts as estimates.
        </p>
        <p className="mt-3">
          NSF funds the engineering and device side of women&apos;s health. Most federal women&apos;s health money comes from NIH,
          which Unshelved does not load yet. Researchers are NSF PIs matched to patent inventors by name at the same university.
          Sources: NSF Award Search and Google Patents Public Datasets. Built {date(refreshed_at.slice(0, 10))}.
        </p>
      </section>
    </div>
  );
}
