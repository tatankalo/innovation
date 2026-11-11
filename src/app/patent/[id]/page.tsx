import Link from "next/link";
import { notFound } from "next/navigation";
import { patentAbstract, rpc } from "@/lib/supabase";
import { cleanTitle, date, decode, googlePatentUrl, inventorName, LENSES, money, pubLabel, SECTORS } from "@/lib/format";
import { ExternalLink, LineageBadge, Meta, ProgramTag, ReadinessBadge, SectionLabel, TopicChip } from "@/components/ui";

export const dynamic = "force-dynamic";

type Detail = {
  family: {
    family_id: string;
    rep_number: string;
    title: string;
    abstract?: string | null;
    pub_numbers: string[] | null;
    inventors: string[];
    cpc: string[];
    assignees: string[];
    has_grant: boolean;
    first_grant: string | null;
    first_filing: string | null;
    priority_date: string | null;
    first_pub: string | null;
  } | null;
  publications: { number: string; kind: string; published: string; granted: string | null }[];
  universities: { id: number; name: string; state: string; match: string }[];
  tags: { sector: string | null; climate: boolean; agtech: boolean; climate_sub: string | null; ag_sub: string | null; readiness: number | null } | null;
  lineage: {
    award_id: string;
    program: string;
    title: string;
    pi: string;
    start: string;
    amount: number;
    persons: string[];
    inventors: string[];
    university: string;
    university_id: number;
    system_only: boolean;
  }[];
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await rpc<Detail>("patent_detail", { fid: id });
  return { title: d.family ? `${cleanTitle(d.family.title)} · Unshelved` : "Unshelved" };
}

export default async function PatentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await rpc<Detail>("patent_detail", { fid: id });
  if (!d.family) notFound();
  const f = d.family;
  const abstract = f.abstract ?? (await patentAbstract(f.rep_number));
  const filings = f.pub_numbers?.length ? f.pub_numbers : d.publications.map((p) => p.number);
  const exact = d.universities.filter((u) => u.match === "exact");
  const system = d.universities.filter((u) => u.match !== "exact");
  const lineageMatched = new Set(d.lineage.flatMap((l) => l.inventors));

  return (
    <article className="mx-auto max-w-[1120px] px-4 sm:px-8 pt-12">
      <Link href="/" className="text-[14px] text-ink-3 hover:text-ink">← Search</Link>
      <header className="mt-8 pb-10 border-b border-rule">
        <div className="flex items-center gap-4 flex-wrap mb-5">
          <ProgramTag program="patent" />
          <Meta>{f.has_grant ? `Granted ${date(f.first_grant)}` : `Published ${date(f.first_pub)}`}</Meta>
          {d.lineage.length > 0 && <LineageBadge n={d.lineage.length} />}
        </div>
        <h1 className="font-serif text-[34px] leading-[40px] sm:text-[44px] sm:leading-[50px] tracking-[-0.015em] max-w-[880px]">
          {cleanTitle(f.title)}
        </h1>
        <p className="mt-5 text-[17px] text-ink-2">
          {exact.length > 0
            ? exact.map((u, i) => (
                <span key={u.id}>
                  {i > 0 && ", "}
                  <Link href={`/university/${u.id}`} className="text-ink underline decoration-rule underline-offset-4 hover:decoration-ink">{u.name}</Link>
                </span>
              ))
            : system.length > 0 && <span className="text-ink">{systemName(system.map((s) => s.name))}</span>}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ExternalLink href={googlePatentUrl(f.rep_number)}>Google Patents</ExternalLink>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_300px] gap-12 lg:gap-16 pt-10">
        <div className="min-w-0">
          <SectionLabel>Abstract</SectionLabel>
          <p className="text-[18px] leading-[30px] max-w-[68ch]">{abstract ? decode(abstract) : "No abstract on file."}</p>

          <section className="mt-16">
            <SectionLabel right={d.lineage.length ? `${d.lineage.length} linked ${d.lineage.length === 1 ? "award" : "awards"}` : undefined}>
              <span className="text-accent">Lineage</span>: NSF awards led by these inventors
            </SectionLabel>
            {d.lineage.length === 0 ? (
              <p className="text-ink-2 text-[15px]">
                No NSF award in this dataset lists one of these inventors as PI or co-PI at the same university.
              </p>
            ) : (
              <ul className="space-y-4">
                {d.lineage.slice(0, 15).map((l) => (
                  <li key={l.award_id} className="border border-rule border-l-2 border-l-accent bg-surface rounded-[2px] p-5">
                    <div className="flex items-center gap-4 flex-wrap mb-2">
                      <ProgramTag program={l.program} />
                      <Meta>{date(l.start)} · {money(l.amount)} · Award {l.award_id}</Meta>
                    </div>
                    <Link href={`/award/${l.award_id}`} className="font-serif text-[21px] leading-7 hover:text-accent">
                      {cleanTitle(l.title)}
                    </Link>
                    <p className="mt-2 text-[14px] text-ink-2">
                      <span className="text-accent font-medium">{l.persons.join(", ")}</span> appears on the award and on this patent at {l.university}.
                      {l.system_only && " Matched at system level. Confirm the campus."}
                    </p>
                  </li>
                ))}
                {d.lineage.length > 15 && <li className="text-[14px] text-ink-3">And {d.lineage.length - 15} more.</li>}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-10 text-[15px]">
          {d.tags && (
            <div>
              <h2 className="label mb-3">Topic and readiness</h2>
              <div className="space-y-2">
                {d.tags.sector && <p>{SECTORS[d.tags.sector] ?? d.tags.sector}</p>}
                <div className="flex flex-wrap gap-2">
                  {d.tags.climate && <Link href="/?l=climate"><TopicChip>Climate{d.tags.climate_sub && LENSES.climate.subs[d.tags.climate_sub] ? `: ${LENSES.climate.subs[d.tags.climate_sub]}` : ""}</TopicChip></Link>}
                  {d.tags.agtech && <Link href="/?l=agtech"><TopicChip>Ag tech{d.tags.ag_sub && LENSES.agtech.subs[d.tags.ag_sub] ? `: ${LENSES.agtech.subs[d.tags.ag_sub]}` : ""}</TopicChip></Link>}
                </div>
                <ReadinessBadge value={d.tags.readiness} />
                <p className="text-[12px] text-ink-3">Tagged by AI from the abstract.</p>
              </div>
            </div>
          )}
          <div>
            <h2 className="label mb-3">Inventors</h2>
            <ul className="space-y-1.5">
              {f.inventors.map((i) => (
                <li key={i} className="flex items-center gap-2">
                  {lineageMatched.has(i) && <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-label="Also an NSF PI" />}
                  <span className={lineageMatched.has(i) ? "font-medium" : ""}>{inventorName(i)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="label mb-3">Key dates</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5">
              {f.priority_date && (<><dt className="text-ink-3">Priority</dt><dd className="font-mono text-[13px] tnum">{date(f.priority_date)}</dd></>)}
              {f.first_filing && (<><dt className="text-ink-3">Filed</dt><dd className="font-mono text-[13px] tnum">{date(f.first_filing)}</dd></>)}
              {f.first_pub && (<><dt className="text-ink-3">Published</dt><dd className="font-mono text-[13px] tnum">{date(f.first_pub)}</dd></>)}
              {f.first_grant && (<><dt className="text-ink-3">Granted</dt><dd className="font-mono text-[13px] tnum">{date(f.first_grant)}</dd></>)}
            </dl>
          </div>
          <div>
            <h2 className="label mb-3">Filings in this family</h2>
            <ul className="space-y-1.5">
              {filings.map((n) => (
                <li key={n}>
                  <a href={googlePatentUrl(n)} target="_blank" rel="noreferrer" className="font-mono text-[13px] hover:text-accent">
                    {pubLabel(n)} ↗
                  </a>
                  {n === f.rep_number && filings.length > 1 && <span className="ml-2 text-[12px] text-ink-3">shown here</span>}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="label mb-3">Assignees</h2>
            <ul className="space-y-1 text-ink-2">
              {f.assignees.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </div>
          {f.cpc?.length > 0 && (
            <div>
              <h2 className="label mb-3">CPC classes</h2>
              <p className="font-mono text-[12px] leading-6 text-ink-2">{f.cpc.slice(0, 12).join("  ")}</p>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}

function systemName(names: string[]) {
  if (names.some((n) => n.startsWith("University of California"))) return "University of California system";
  if (names.some((n) => n.startsWith("University of Texas"))) return "University of Texas system";
  return names.join(", ");
}
