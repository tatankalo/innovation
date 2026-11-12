import Link from "next/link";
import { notFound } from "next/navigation";
import { rpc } from "@/lib/supabase";
import { cleanTitle, date, nsfUrl, num } from "@/lib/format";
import { Meta, SectionLabel } from "@/components/ui";
import { authorName, PaperList, type Paper } from "@/components/Publications";

export const dynamic = "force-dynamic";

type Profile = {
  acronym: string;
  name: string | null;
  awards: {
    id: string;
    title: string;
    awardee: string | null;
    university_id: number | null;
    university: string | null;
    state: string | null;
    pi: string | null;
    start: string | null;
    exp: string | null;
    papers: number;
    in_app: boolean;
  }[];
  papers: Paper[];
  authors: { name: string; papers: number; first: number | null; last: number | null }[];
} | null;

export async function generateMetadata({ params }: { params: Promise<{ acr: string }> }) {
  const { acr } = await params;
  return { title: `${decodeURIComponent(acr)} · IUCRC center · Unshelved` };
}

export default async function CenterPage({ params }: { params: Promise<{ acr: string }> }) {
  const { acr } = await params;
  const c = await rpc<Profile>("center_profile", { acr: decodeURIComponent(acr) });
  if (!c) notFound();
  const pis = new Set(c.awards.map((a) => (a.pi ?? "").toLowerCase().split(/\s+/).pop()));
  // Authors who are not a site PI: mostly students, postdocs and research staff.
  const team = c.authors.filter((a) => !pis.has(a.name.split(",")[0].trim().toLowerCase()));
  const leads = c.authors.filter((a) => pis.has(a.name.split(",")[0].trim().toLowerCase()));
  const allAuthors = new Set(c.papers.flatMap((p) => p.authors));
  const totalAuthors = allAuthors.size;
  const beyond = [...allAuthors].filter((a) => !pis.has(a.split(",")[0].trim().toLowerCase())).length;
  const years = c.papers.map((p) => p.year).filter((y): y is number => !!y);
  const sites = [...new Map(c.awards.map((a) => [a.university_id ?? a.awardee, a])).values()];

  return (
    <div className="@container mx-auto max-w-[1120px] px-4 sm:px-8 pt-12">
      <Link data-back-link href="/centers" className="text-[14px] text-ink-3 hover:text-ink">← IUCRC centers</Link>
      <header className="mt-8 pb-10 border-b border-rule">
        <p className="label mb-4">
          NSF IUCRC · <span className="text-accent">{c.acronym}</span>
        </p>
        <h1 className="font-serif text-[38px] leading-[44px] sm:text-[52px] sm:leading-[58px] tracking-[-0.02em] max-w-[900px]">{c.name ?? c.acronym}</h1>
      </header>

      <section className="grid grid-cols-2 @4xl:grid-cols-4 border-b border-rule">
        <Figure n={num(sites.length)} label="University sites" sub={`${num(c.awards.length)} NSF awards`} />
        <Figure n={num(c.papers.length)} label="Papers" sub={years.length ? `${Math.min(...years)} to ${Math.max(...years)}` : "None reported yet"} border />
        <Figure n={num(totalAuthors)} label="Authors" sub="Students, postdocs and faculty" border />
        <Figure n={num(beyond)} label="Beyond the PIs" sub="Likely students and postdocs" border accent />
      </section>

      <div className="grid @4xl:grid-cols-[1fr_320px] gap-12 @4xl:gap-16 mt-14">
        <section className="min-w-0">
          <SectionLabel right={`${num(c.papers.length)} papers`}>Publications</SectionLabel>
          {c.papers.length ? (
            <PaperList papers={c.papers} initial={10} />
          ) : (
            <p className="text-ink-2 text-[15px]">No papers reported to NSF on these awards yet. New sites often report after their first year.</p>
          )}
          <p className="mt-6 text-[12px] text-ink-3">Source: NSF Public Access Repository, by award number.</p>
        </section>

        <aside className="space-y-12 text-[15px]">
          <div>
            <h2 className="label mb-3">Sites</h2>
            <ul className="space-y-4">
              {c.awards.map((a) => (
                <li key={a.id}>
                  {a.university_id ? (
                    <Link href={`/university/${a.university_id}`} className="font-medium hover:text-accent">{a.university ?? a.awardee}</Link>
                  ) : (
                    <span className="font-medium">{a.awardee}</span>
                  )}
                  <p className="text-[13px] text-ink-3">
                    {a.pi ? `PI ${a.pi} · ` : ""}
                    {date(a.start)}
                    {a.papers ? ` · ${a.papers} papers` : ""}
                  </p>
                  {a.in_app ? (
                    <Link href={`/award/${a.id}`} className="font-mono text-[12px] text-ink-3 hover:text-accent">Award {a.id}</Link>
                  ) : (
                    <a href={nsfUrl(a.id)} target="_blank" rel="noreferrer" className="font-mono text-[12px] text-ink-3 hover:text-accent">Award {a.id} ↗</a>
                  )}
                  <p className="sr-only">{cleanTitle(a.title)}</p>
                </li>
              ))}
            </ul>
          </div>
          {team.length > 0 && (
            <div>
              <h2 className="label mb-1">Most active researchers</h2>
              <p className="text-[13px] text-ink-3 mb-3">Authors who are not a site PI. Most are graduate students and postdocs.</p>
              <ul className="space-y-1.5">
                {team.slice(0, 25).map((a) => (
                  <li key={a.name} className="flex items-baseline justify-between gap-3">
                    <span>{authorName(a.name)}</span>
                    <Meta>
                      {a.papers} {a.papers === 1 ? "paper" : "papers"}
                      {a.first ? ` · ${a.first === a.last ? a.first : `${a.first}–${String(a.last).slice(2)}`}` : ""}
                    </Meta>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {leads.length > 0 && (
            <div>
              <h2 className="label mb-3">Faculty leads on papers</h2>
              <ul className="space-y-1.5">
                {leads.slice(0, 10).map((a) => (
                  <li key={a.name} className="flex items-baseline justify-between gap-3">
                    <span>{authorName(a.name)}</span>
                    <Meta>{a.papers} papers</Meta>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Figure({ n, label, sub, border, accent }: { n: string; label: string; sub: string; border?: boolean; accent?: boolean }) {
  return (
    <div className={`py-8 pr-6 ${border ? "pl-6 border-l border-rule" : ""} [&:nth-child(3)]:pl-0 [&:nth-child(3)]:border-l-0 @4xl:[&:nth-child(3)]:pl-6 @4xl:[&:nth-child(3)]:border-l [&:nth-child(n+3)]:border-t @4xl:[&:nth-child(n+3)]:border-t-0 border-rule`}>
      <div className={`font-serif text-[40px] sm:text-[48px] leading-none tracking-[-0.02em] tnum ${accent ? "text-accent" : ""}`}>{n}</div>
      <div className="mt-3 text-[15px] font-medium">{label}</div>
      <div className="mt-1 text-[13px] text-ink-3">{sub}</div>
    </div>
  );
}
