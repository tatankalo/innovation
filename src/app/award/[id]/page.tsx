import Link from "next/link";
import { notFound } from "next/navigation";
import { rpc, supabase } from "@/lib/supabase";
import { PaperList, type Paper } from "@/components/Publications";
import { cleanTitle, companyName, date, decode, googlePatentUrl, inventorName, LENSES, money, nsfUrl, PROGRAMS, SECTORS } from "@/lib/format";
import { Email, ExternalLink, LineageBadge, Meta, ProgramTag, ReadinessBadge, SectionLabel, TopicChip } from "@/components/ui";

export const dynamic = "force-dynamic";

type Detail = {
  award: {
    id: string;
    program: string;
    title: string;
    abstract: string | null;
    awardee_name: string;
    pi_name: string | null;
    co_pis: string[] | null;
    start_date: string | null;
    exp_date: string | null;
    amount: number | null;
    fund_program: string | null;
    state: string | null;
    abstract_in_db: boolean | null;
    // Contact fields. Shown in full whenever the award row carries them.
    pi_email?: string | null;
    co_pi_contacts?: { name: string; email: string | null }[] | null;
  } | null;
  university: { id: number; name: string; state: string } | null;
  tags: { sector: string | null; climate: boolean; agtech: boolean; climate_sub: string | null; ag_sub: string | null; readiness: number | null } | null;
  lineage: {
    family_id: string;
    rep_number: string;
    title: string;
    first_pub: string;
    has_grant: boolean;
    persons: string[];
    inventors: string[];
    system_only: boolean;
  }[];
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await rpc<Detail>("award_detail", { aid: id });
  return { title: d.award ? `${cleanTitle(d.award.title)} · Unshelved` : "Unshelved" };
}

/** NSF abstracts often end with a boilerplate statutory paragraph. Split it off. */
function splitAbstract(a: string | null) {
  if (!a) return { body: [] as string[], boiler: "" };
  const marker = "This award reflects NSF's statutory mission";
  const i = a.indexOf(marker);
  a = decode(a);
  const main = i >= 0 ? a.slice(0, i) : a;
  const boiler = i >= 0 ? a.slice(i) : "";
  const body = main
    .replace(/<br\s*\/?>/gi, "\n")
    .split(/\n\s*\n|\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  return { body, boiler };
}

export default async function AwardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [d, papers, centerRow, spin] = await Promise.all([
    rpc<Detail>("award_detail", { aid: id }),
    rpc<Paper[]>("award_publications", { aid: id }),
    supabase.from("iucrc_center_awards").select("center, iucrc_centers(name)").eq("award_id", id).maybeSingle(),
    rpc<{ university_id: number; university: string; person: string; via: string; n_families: number; family_id: string | null }[]>("award_spinout", { aid: id }),
  ]);
  if (!d.award) notFound();
  const a = d.award;
  const center = centerRow.data as unknown as { center: string; iucrc_centers: { name: string | null } | null } | null;
  const { body, boiler } = splitAbstract(a.abstract);
  const people = [a.pi_name, ...(a.co_pis ?? [])].filter(Boolean) as string[];
  const norm = (n: string) => n.toLowerCase().replace(/[^a-z]/g, "");
  const contactByName = new Map((a.co_pi_contacts ?? []).map((c) => [norm(c.name), c.email]));
  const emails = people.map((p, i) => (i === 0 && a.pi_name ? a.pi_email : contactByName.get(norm(p))) ?? null);
  const linked = new Set(d.lineage.flatMap((l) => l.persons));

  return (
    <article className="@container mx-auto max-w-[1120px] px-4 sm:px-8 pt-12">
      <Link data-back-link href="/" className="text-[14px] text-ink-3 hover:text-ink">← Search</Link>
      <header className="mt-8 pb-10 border-b border-rule">
        <div className="flex items-center gap-4 flex-wrap mb-5">
          <ProgramTag program={a.program} />
          <Meta>Award {a.id} · {date(a.start_date)}</Meta>
          {d.lineage.length > 0 && <LineageBadge n={d.lineage.length} />}
        </div>
        <h1 className="font-serif text-[34px] leading-[40px] sm:text-[44px] sm:leading-[50px] tracking-[-0.015em] max-w-[880px]">
          {cleanTitle(a.title)}
        </h1>
        <p className="mt-5 text-[17px] text-ink-2">
          {d.university ? (
            <Link href={`/university/${d.university.id}`} className="text-ink underline decoration-rule underline-offset-4 hover:decoration-ink">{d.university.name}</Link>
          ) : (
            <span className="text-ink">{a.awardee_name}</span>
          )}
          {d.university && a.awardee_name && d.university.name !== a.awardee_name && (a.program === "sttr" || a.program === "sbir") && (
            <span> · with {a.awardee_name}</span>
          )}
        </p>
        <dl className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-[760px]">
          <Stat label="Amount" value={money(a.amount, false)} />
          <Stat label="Program" value={PROGRAMS[a.program]?.label ?? a.program} />
          <Stat label="Starts" value={date(a.start_date)} />
          <Stat label="Ends" value={date(a.exp_date)} />
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <ExternalLink href={nsfUrl(a.id)}>{a.abstract_in_db === false ? "Read the full abstract on NSF" : "NSF award page"}</ExternalLink>
        </div>
      </header>

      <div className="grid @4xl:grid-cols-[1fr_300px] gap-12 @4xl:gap-16 pt-10">
        <div className="min-w-0">
          {spin.length > 0 && (
            <section className="mb-14 bg-panel rounded-[2px] p-6">
              <p className="eyebrow">University startup · Aspire candidate</p>
              <ul className="mt-3 space-y-2 text-[16px] leading-7">
                {spin.map((x) => (
                  <li key={x.university_id + x.person}>
                    <span className="font-semibold">{x.person}</span> is {x.via === "nsf_pi" ? "an NSF-funded researcher" : `an inventor on ${x.n_families} ${x.n_families === 1 ? "patent" : "patents"}`} at{" "}
                    <Link href={`/university/${x.university_id}`} className="underline decoration-rule underline-offset-4 hover:decoration-ink">{x.university}</Link>
                    {x.via === "both" && ", and an NSF PI there"}.
                    {x.family_id && (
                      <Link href={`/patent/${x.family_id}`} className="ml-2 text-[14px] font-semibold text-accent hover:underline underline-offset-4">See a patent →</Link>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[12px] text-ink-3">Matched by name within the same state, so likely but not confirmed. {companyName(a.awardee_name)} may be a spinout.</p>
            </section>
          )}

          <section>
            <SectionLabel right={d.lineage.length ? `${d.lineage.length} patent ${d.lineage.length === 1 ? "family" : "families"}` : undefined}>
              <span className="text-accent">Lineage</span>: patents by this team
            </SectionLabel>
            {d.lineage.length === 0 ? (
              <p className="text-ink-2 text-[15px]">
                No patent in this dataset lists the PI or a co-PI as an inventor at {d.university?.name ?? "this awardee"}.
              </p>
            ) : (
              <ul className="space-y-4">
                {d.lineage.slice(0, 12).map((l) => (
                  <li key={l.family_id} className="border border-rule border-l-2 border-l-accent bg-surface rounded-[2px] p-5">
                    <div className="flex items-center gap-4 flex-wrap mb-2">
                      <ProgramTag program="patent" />
                      <Meta>{l.has_grant ? "Granted" : "Published"} · {date(l.first_pub)}</Meta>
                      {a.start_date && l.first_pub >= a.start_date && <Meta>After award start</Meta>}
                    </div>
                    <Link href={`/patent/${l.family_id}`} className="font-serif text-[21px] leading-7 hover:text-accent">
                      {cleanTitle(l.title)}
                    </Link>
                    <p className="mt-2 text-[14px] text-ink-2">
                      Inventor match: <span className="text-accent font-medium">{l.inventors.map(inventorName).join(", ")}</span>
                      {l.system_only && ". Matched at system level. Confirm the campus."}
                    </p>
                    <a href={googlePatentUrl(l.rep_number)} target="_blank" rel="noreferrer" className="mt-2 inline-block font-mono text-[12px] text-ink-3 hover:text-accent">
                      {l.rep_number} ↗
                    </a>
                  </li>
                ))}
                {d.lineage.length > 12 && <li className="text-[14px] text-ink-3">And {d.lineage.length - 12} more.</li>}
              </ul>
            )}
          </section>

          {(papers.length > 0 || center) && (
            <section className="mt-16">
              <SectionLabel right={papers.length ? `${papers.length} ${papers.length === 1 ? "paper" : "papers"}` : undefined}>
                Publications from this award
              </SectionLabel>
              {papers.length ? (
                <PaperList papers={papers} initial={5} />
              ) : (
                <p className="text-ink-2 text-[15px]">No papers reported to NSF on this award yet.</p>
              )}
              {center && (
                <p className="mt-4 text-[14px]">
                  <Link href={`/center/${encodeURIComponent(center.center)}`} className="text-accent font-medium hover:underline underline-offset-4">
                    See every site and paper of {center.iucrc_centers?.name ?? center.center} ({center.center}) →
                  </Link>
                </p>
              )}
            </section>
          )}

          <section className="mt-16">
            <SectionLabel>Abstract</SectionLabel>
            <div className="space-y-5 text-[18px] leading-[30px] max-w-[68ch]">
              {body.length ? (
                body.map((p, i) => <p key={i}>{p}</p>)
              ) : a.abstract_in_db === false ? (
                <p className="text-ink-2">
                  Unshelved holds the title, team, dates and amount for this award.{" "}
                  <a href={nsfUrl(a.id)} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-4">
                    Read the full abstract on NSF ↗
                  </a>
                </p>
              ) : (
                <p>No abstract on file.</p>
              )}
            </div>
            {boiler && <p className="mt-6 text-[13px] leading-5 text-ink-3 max-w-[68ch]">{boiler}</p>}
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
            <h2 className="label mb-3">Team</h2>
            <ul className="space-y-2">
              {people.map((p, i) => (
                <li key={p + i}>
                  <div className="flex items-baseline gap-2">
                    {linked.has(p) && <span className="w-1.5 h-1.5 rounded-full bg-accent translate-y-[-2px]" aria-label="Also a patent inventor" />}
                    <span className={linked.has(p) ? "font-medium" : ""}>{p}</span>
                    <span className="text-[12px] text-ink-3">{i === 0 ? "PI" : "Co-PI"}</span>
                  </div>
                  <Email address={emails[i]} className="block" />
                </li>
              ))}
            </ul>
            {linked.size > 0 && <p className="mt-3 text-[13px] text-ink-3">Marked names also appear as patent inventors.</p>}
          </div>
          {a.fund_program && (
            <div>
              <h2 className="label mb-3">NSF program</h2>
              <p className="text-ink-2">{a.fund_program}</p>
            </div>
          )}
          {a.awardee_name && (
            <div>
              <h2 className="label mb-3">Awardee</h2>
              <p className="text-ink-2">{a.awardee_name}{a.state ? `, ${a.state}` : ""}</p>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className="mt-1 font-serif text-[22px] leading-7 tnum">{value || "Not listed"}</dd>
    </div>
  );
}
