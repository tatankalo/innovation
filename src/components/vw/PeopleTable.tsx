import Link from "next/link";
import { Email, LineageBadge, ReadinessBadge, TopicChip } from "@/components/ui";
import { cleanTitle, date, LENSES, money } from "@/lib/format";
import { type Person, uniLabel } from "@/lib/vw";

/** Recruiting shortlist: one row per person. Name, school, contact, the award that qualifies them, the signals. */
export default function PeopleTable({ rows, start = 1 }: { rows: Person[]; start?: number }) {
  return (
    <ol className="border-t border-rule">
      {rows.map((p, i) => {
        const subs = [
          ...(p.climate_subs ?? []).map((s) => LENSES.climate.subs[s]).filter(Boolean),
          ...(p.ag_subs ?? []).map((s) => LENSES.agtech.subs[s]).filter(Boolean),
        ].slice(0, 2);
        return (
          <li key={p.pid} className="grid sm:grid-cols-[36px_minmax(0,1fr)_200px] gap-x-4 gap-y-2 py-5 border-b border-rule break-inside-avoid">
            <span className="hidden sm:block font-mono text-[12px] text-ink-3 tnum pt-1.5">{start + i}</span>
            <div className="min-w-0">
              <div className="flex items-baseline gap-3 flex-wrap">
                <h3 className="font-serif text-[21px] leading-7">{p.name}</h3>
                <span className="text-[13px] text-ink-3">{p.is_pi ? "PI" : "Co-PI"}</span>
              </div>
              <p className="text-[14px] font-medium text-ink-2">
                <Link href={`/university/${p.university_id}`} className="hover:text-accent">{uniLabel(p.university)}</Link>
                {p.state && <span className="font-normal text-ink-3"> · {p.state}</span>}
                {p.hbcu && <span className="font-normal text-ink-3"> · HBCU</span>}
                {p.epscor && <span className="font-normal text-ink-3"> · EPSCoR</span>}
              </p>
              {p.award_id && p.award_title && (
                <Link href={`/award/${p.award_id}`} data-record scroll={false} className="mt-1 block text-[15px] leading-6 text-ink-2 hover:text-accent line-clamp-2 max-w-[68ch]">
                  {cleanTitle(p.award_title)}
                </Link>
              )}
              <div className="mt-2"><Email address={p.email} /></div>
            </div>
            <div className="flex sm:flex-col sm:items-end gap-x-4 gap-y-1.5 flex-wrap text-[13px]">
              <ReadinessBadge value={p.max_readiness} />
              {p.n_patents > 0 && <LineageBadge n={p.n_patents} />}
              <span className="font-mono text-[12px] text-ink-3 tnum">
                {p.n_awards} NSF {p.n_awards === 1 ? "award" : "awards"}
                {p.total_dollars ? ` · ${money(p.total_dollars)}` : ""}
              </span>
              {p.last_award && <span className="font-mono text-[12px] text-ink-3 tnum">Latest {date(p.last_award)}</span>}
              <span className="flex gap-1.5 flex-wrap sm:justify-end">
                {p.has_icorps && <TopicChip>I-Corps</TopicChip>}
                {p.has_iucrc && <TopicChip>IUCRC</TopicChip>}
                {subs.map((s) => <TopicChip key={s}>{s}</TopicChip>)}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
