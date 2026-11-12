import Link from "next/link";
import PeopleTable from "@/components/vw/PeopleTable";
import PrintButton from "@/components/vw/PrintButton";
import { Meta } from "@/components/ui";
import { num } from "@/lib/format";
import { rpc } from "@/lib/supabase";
import { getShortlist, LIST_TOPICS, parseSegment, parseTopic, parseUni, SEGMENTS, uniLabel, type Segment } from "@/lib/vw";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Recruiting shortlist · Unshelved",
  description: "NSF-funded researchers who could lead Pioneer and Propel teams or join funder programs, with contact details.",
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const PER = 50;

export default async function People({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const topic = parseTopic(one(sp.topic));
  const seg = parseSegment(one(sp.seg));
  const msi = one(sp.msi) === "1";
  const page = Math.max(1, Number(one(sp.p) ?? 1) || 1);
  const uni = parseUni(one(sp.uni));
  const [res, unis] = await Promise.all([
    getShortlist({ topic, seg, msi, uni, lim: PER, off: (page - 1) * PER }),
    uni ? rpc<{ id: number; name: string }[]>("list_universities") : null,
  ]);
  const uniName = uni ? uniLabel(res.rows[0]?.university ?? unis?.find((u) => u.id === uni)?.name ?? `University ${uni}`) : null;

  const href = (o: Partial<{ topic: string; seg: Segment; msi: boolean; uni: number | null; p: number }>) => {
    const n = new URLSearchParams();
    const tt = o.topic ?? topic;
    const ss = o.seg ?? seg;
    const mm = o.msi ?? msi;
    if (tt !== "all") n.set("topic", tt);
    if (ss !== "ready") n.set("seg", ss);
    if (mm) n.set("msi", "1");
    const uu = o.uni === undefined ? uni : o.uni;
    if (uu) n.set("uni", String(uu));
    if (o.p && o.p > 1) n.set("p", String(o.p));
    const s = n.toString();
    return s ? `/people?${s}` : "/people";
  };
  const csv = `/api/people?topic=${topic}&seg=${seg}${msi ? "&msi=1" : ""}${uni ? `&uni=${uni}` : ""}`;
  const tab = (active: boolean) =>
    active ? "font-semibold text-ink border-b-2 border-accent pb-1" : "text-ink-2 hover:text-ink pb-1";

  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-8 pt-12">
      <p className="label mb-4">Recruiting shortlist</p>
      <h1 className="font-serif text-[40px] leading-[44px] sm:text-[56px] sm:leading-[60px] tracking-[-0.02em] max-w-[900px]">
        {num(res.total)} {res.total === 1 ? "person" : "people"} <em className="text-ink-2">{SEGMENTS[seg].phrase}.</em>
      </h1>
      <p className="mt-4 text-[17px] leading-7 text-ink-2 max-w-[680px]">{SEGMENTS[seg].rule}</p>
      <p className="mt-1 text-[15px] leading-7 text-ink-3 max-w-[680px]">Use: {SEGMENTS[seg].use}</p>

      {uni && (
        <p className="mt-6 flex items-center gap-3 flex-wrap text-[14px]">
          <span className="label">University</span>
          <span className="inline-flex items-center gap-2 h-8 pl-3 pr-1 rounded-[2px] border border-accent bg-accent-wash font-semibold">
            {uniName}
            <Link href={href({ uni: null })} scroll={false} aria-label={`Clear the university filter: ${uniName}`} className="no-print inline-flex items-center justify-center w-6 h-6 rounded-[2px] text-ink-2 hover:text-ink hover:bg-surface">
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden><path d="M1 1l8 8M9 1l-8 8" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
            </Link>
          </span>
          <Link href={`/university/${uni}`} className="no-print text-ink-2 hover:text-accent underline decoration-rule underline-offset-4">University page</Link>
          <Link href={href({ uni: null })} scroll={false} className="no-print text-ink-2 hover:text-accent underline decoration-rule underline-offset-4">Show all universities</Link>
        </p>
      )}

      <div className="mt-10 space-y-4 no-print">
        <div className="flex gap-6 flex-wrap text-[14px]">
          <span className="label pt-0.5 w-16">Group</span>
          {(["ready", "early", "alumni", "all"] as Segment[]).map((s) => (
            <Link key={s} href={href({ seg: s })} scroll={false} className={tab(seg === s)}>{SEGMENTS[s].short}</Link>
          ))}
        </div>
        <div className="flex gap-6 flex-wrap text-[14px]">
          <span className="label pt-0.5 w-16">Topic</span>
          {LIST_TOPICS.map(([k, l]) => (
            <Link key={k} href={href({ topic: k })} scroll={false} className={tab(topic === k)}>{l}</Link>
          ))}
        </div>
        <div className="flex gap-6 flex-wrap text-[14px] items-center">
          <span className="label pt-0.5 w-16">Reach</span>
          <Link href={href({ msi: !msi })} scroll={false} className={`inline-flex items-center gap-2 ${msi ? "font-semibold text-ink" : "text-ink-2 hover:text-ink"}`}>
            <span className={`w-[14px] h-[14px] rounded-[2px] border ${msi ? "bg-accent border-accent" : "border-ink-3"}`} aria-hidden />
            Only HBCUs and EPSCoR states
          </Link>
          <span className="ml-auto flex gap-3">
            <a href={csv} download className="inline-flex items-center gap-2 h-9 px-4 rounded-[2px] border border-rule hover:border-ink font-medium text-ink">
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M6 1v7M3 5.5 6 8.5l3-3M1.5 10.5h9" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
              Download CSV
              <span className="font-mono text-[12px] text-ink-3 tnum">{num(Math.min(res.total, 5000))}</span>
            </a>
            <PrintButton label="Print" />
          </span>
        </div>
      </div>

      <div className="mt-8">
        {res.rows.length === 0 ? (
          <p className="py-16 border-t border-rule font-serif text-[24px]">Nobody matches these filters.</p>
        ) : (
          <PeopleTable rows={res.rows} start={(page - 1) * PER + 1} />
        )}
        {res.total > PER && (
          <nav className="flex items-center justify-between py-8 text-[14px] font-medium no-print">
            {page > 1 ? <Link href={href({ p: page - 1 })} className="hover:text-accent">← Previous</Link> : <span />}
            <Meta>Page {page} of {Math.ceil(res.total / PER)}</Meta>
            {page * PER < res.total ? <Link href={href({ p: page + 1 })} className="hover:text-accent">Next →</Link> : <span />}
          </nav>
        )}
      </div>
      <p className="mt-6 text-[13px] leading-6 text-ink-3 max-w-[76ch]">
        Ranked by readiness of the person&rsquo;s best NSF award, then patent count, then NSF dollars. A name match between an
        award and a patent at the same university shows the same person, not that the award produced the patent. Contact
        emails come from public NSF award records.
      </p>
    </div>
  );
}
