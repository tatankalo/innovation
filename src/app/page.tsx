import Link from "next/link";
import { Suspense } from "react";
import SearchBox from "@/components/SearchBox";
import Filters from "@/components/Filters";
import { Email, Highlight, LineageBadge, Meta, ProgramTag, ReadinessBadge, TopicChip } from "@/components/ui";
import { awardSnippets, rpc } from "@/lib/supabase";
import { searchArgs } from "@/lib/searchParams";
import { cleanTitle, date, decode, LENSES, money, num } from "@/lib/format";

export const dynamic = "force-dynamic";

type Stats = {
  patents: number;
  families: number;
  awards: number;
  universities: number;
  lineage_awards: number;
  lineage_families: number;
  award_dollars: number;
  climate: number;
  agtech: number;
};
type Hit = {
  kind: "patent" | "award";
  id: string;
  ref: string;
  title: string;
  snippet: string | null;
  program: string;
  year: number | null;
  date: string | null;
  university_ids: number[];
  amount: number | null;
  has_lineage: boolean;
  lite: boolean;
  pi: string | null;
  pi_email: string | null;
  sector: string | null;
  climate: boolean;
  agtech: boolean;
  climate_sub: string | null;
  ag_sub: string | null;
  readiness: number | null;
};
type Feature = {
  award_id: string;
  program: string;
  award_title: string;
  start_date: string;
  amount: number;
  family_id: string;
  rep_number: string;
  patent_title: string;
  first_pub: string;
  has_grant: boolean;
  persons: string[];
  university_id: number;
  university: string;
};
type Uni = { id: number; name: string; state: string | null };

const EXAMPLES = [
  "cheaper water desalination for farms",
  "soft robotics gripper",
  "solid state battery electrolyte",
  "early detection of sepsis",
  "quantum sensing",
];

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function Home({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const searching = ["q", "t", "u", "s", "yf", "yt", "l", "sec", "o"].some((k) => sp[k] !== undefined);
  return searching ? <Results sp={sp} /> : <Landing />;
}

async function Landing() {
  const [stats, features] = await Promise.all([rpc<Stats>("site_stats"), rpc<Feature[]>("featured_lineage", { n: 3 }, { cache: false })]);
  const figures = [
    { n: num(stats.families), label: "patented inventions", sub: "One per patent family" },
    { n: num(stats.awards), label: "NSF awards", sub: "Research, I-Corps, IUCRC, SBIR, STTR" },
    { n: num(stats.universities), label: "universities", sub: "Matched by assignee and awardee" },
    { n: num(stats.lineage_awards), label: "awards with a patent trail", sub: "Same inventor, same university", accent: true },
  ];
  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-8">
      <section className="pt-16 sm:pt-28 pb-14">
        <p className="label mb-6">University technology since 2021</p>
        <h1 className="font-serif text-[44px] leading-[48px] sm:text-[68px] sm:leading-[70px] tracking-[-0.02em] max-w-[900px]">
          Find the inventions NSF funded <em className="text-ink-2">before</em> someone else does.
        </h1>
        <p className="mt-6 text-[19px] leading-8 text-ink-2 max-w-[620px]">
          One search across NSF awards and university patents. Describe a problem in plain English. Unshelved finds the
          labs, the patents and the people behind them.
        </p>
        <div className="mt-10 max-w-[760px]">
          <Suspense>
            <SearchBox autoFocus />
          </Suspense>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[14px] text-ink-3">
            <span>Try</span>
            {EXAMPLES.map((e) => (
              <Link key={e} href={`/?q=${encodeURIComponent(e)}`} className="text-ink-2 hover:text-accent underline decoration-rule underline-offset-4">
                {e}
              </Link>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <LensLink href="/?l=climate&o=readiness" label="Climate lens" n={stats.climate} />
            <LensLink href="/?l=agtech&o=readiness" label="Ag tech lens" n={stats.agtech} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 border-t border-rule">
        {figures.map((f, i) => (
          <div key={f.label} className={`py-8 pr-6 ${i % 2 ? "pl-6 border-l border-rule" : ""} ${i === 2 ? "lg:pl-6 lg:border-l border-rule" : ""} ${i > 1 ? "border-t lg:border-t-0 border-rule" : ""}`}>
            <div className={`font-serif text-[40px] sm:text-[52px] leading-none tracking-[-0.02em] tnum ${f.accent ? "text-accent" : ""}`}>{f.n}</div>
            <div className="mt-3 text-[15px] font-medium">{f.label}</div>
            <div className="mt-1 text-[13px] text-ink-3">{f.sub}</div>
          </div>
        ))}
      </section>

      <section className="mt-20">
        <div className="flex items-baseline justify-between border-b border-rule pb-3 mb-2">
          <h2 className="label">Lineage: same people, grant and patent</h2>
          <span className="text-[13px] text-ink-3">Award PI or co-PI appears as an inventor at the same university</span>
        </div>
        <ul>
          {features.map((f) => (
            <li key={f.award_id} className="grid md:grid-cols-[1fr_48px_1fr] gap-4 md:gap-6 py-8 border-b border-rule">
              <Link href={`/award/${f.award_id}`} className="group block">
                <div className="flex items-center gap-3 mb-2">
                  <ProgramTag program={f.program} />
                  <Meta>{date(f.start_date)} · {money(f.amount)}</Meta>
                </div>
                <h3 className="font-serif text-[22px] leading-7 group-hover:text-accent">{cleanTitle(f.award_title)}</h3>
              </Link>
              <div className="hidden md:flex items-center justify-center text-accent" aria-hidden>
                <svg width="48" height="12" viewBox="0 0 48 12"><circle cx="4" cy="6" r="3.5" fill="currentColor" /><path d="M8 6h30" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" /><path d="M38 1l6 5-6 5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
              </div>
              <Link href={`/patent/${f.family_id}`} className="group block">
                <div className="flex items-center gap-3 mb-2">
                  <ProgramTag program="patent" />
                  <Meta>{f.has_grant ? "Granted" : "Published"} {date(f.first_pub)}</Meta>
                </div>
                <h3 className="font-serif text-[22px] leading-7 group-hover:text-accent">{cleanTitle(f.patent_title)}</h3>
              </Link>
              <p className="md:col-span-3 text-[14px] text-ink-2">
                <span className="text-accent font-medium">{f.persons.join(", ")}</span> at{" "}
                <Link href={`/university/${f.university_id}`} className="underline decoration-rule underline-offset-4 hover:decoration-ink">{f.university}</Link>
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

async function Results({ sp }: { sp: SP }) {
  const args = searchArgs((k) => one(sp[k]));
  const { q, lens, sort } = args;
  const page = Math.max(1, Number(one(sp.p) ?? 1));
  const PER = 25;
  const exportQs = new URLSearchParams(
    Object.entries(sp).flatMap(([k, v]) => (v === undefined || k === "p" ? [] : [[k, String(one(v))]]))
  ).toString();
  const t0 = Date.now();
  const [res, unis] = await Promise.all([
    rpc<{ total: number; relaxed: boolean; hits: Hit[]; facets: Parameters<typeof Filters>[0]["facets"] }>("search_v2", {
      ...args,
      lim: PER,
      off: (page - 1) * PER,
    }),
    rpc<Uni[]>("list_universities"),
  ]);
  const ms = Date.now() - t0;
  const { facets, relaxed } = res;
  const extra = await awardSnippets(res.hits.filter((h) => h.kind === "award" && !h.snippet).map((h) => h.id));
  const hits = res.hits.map((h) => (h.snippet || !extra.has(h.id) ? h : { ...h, snippet: extra.get(h.id)! }));
  const total = res.total;
  const uniName = new Map(unis.map((x) => [x.id, x.name]));
  const sortHref = (o: string) => {
    const n = new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (v === undefined ? [] : [[k, String(one(v))]])));
    if (o === "relevance") n.delete("o");
    else n.set("o", o);
    n.delete("p");
    return `/?${n.toString()}`;
  };
  const pageHref = (p: number) => {
    const n = new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (v === undefined ? [] : [[k, String(one(v))]])));
    n.set("p", String(p));
    return `/?${n.toString()}`;
  };

  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-8 pt-10">
      <div className="max-w-[760px]">
        <Suspense>
          <SearchBox size="md" />
        </Suspense>
      </div>
      <div className="mt-6 mb-8 flex items-baseline gap-3 flex-wrap">
        <h1 className="font-serif text-[32px] leading-10 tracking-[-0.01em]">
          {num(total)} {total === 1 ? "result" : "results"}
          {lens && <span className="text-accent"> in {LENSES[lens].label.toLowerCase()}</span>}
          {q && <span className="text-ink-2"> for “{q}”</span>}
        </h1>
        <Meta>{ms} ms</Meta>
      </div>
      {relaxed && (
        <p className="-mt-4 mb-8 text-[14px] text-ink-2">
          No record contains every word. Showing the closest matches, best first.
        </p>
      )}
      <div className="grid lg:grid-cols-[240px_1fr] gap-10 lg:gap-14">
        <details className="lg:hidden border border-rule rounded-[2px] px-4 py-3" >
          <summary className="label cursor-pointer">Filters</summary>
          <div className="pt-6">
            <Suspense><Filters facets={facets} universities={unis} /></Suspense>
          </div>
        </details>
        <div className="hidden lg:block">
          <Suspense><Filters facets={facets} universities={unis} /></Suspense>
        </div>
        <div>
          {hits.length === 0 && (
            <div className="py-16 border-t border-rule">
              <p className="font-serif text-[24px]">Nothing matched.</p>
              <p className="mt-2 text-ink-2">Try fewer words or remove a filter. Search matches title and abstract text.</p>
            </div>
          )}
          <div className="flex items-center gap-5 pb-3 text-[13px] flex-wrap">
            <span className="label">Sort</span>
            {[["relevance", q ? "Relevance" : "Featured"], ["readiness", "Readiness"], ["newest", "Newest"]].map(([k, label]) => (
              <Link
                key={k}
                href={sortHref(k)}
                scroll={false}
                className={sort === k ? "font-semibold text-ink border-b-2 border-accent pb-0.5" : "text-ink-2 hover:text-ink pb-0.5"}
              >
                {label}
              </Link>
            ))}
            {total > 0 && (
              <a
                href={`/api/export?${exportQs}`}
                download
                className="ml-auto inline-flex items-center gap-2 h-8 px-3 rounded-[2px] border border-rule hover:border-ink font-medium text-ink"
                title={total > 5000 ? "Exports the first 5,000 results in the current sort order" : "Exports every result with the current filters"}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M6 1v7M3 5.5 6 8.5l3-3M1.5 10.5h9" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
                Download CSV
                <span className="font-mono text-[12px] text-ink-3 tnum">{num(Math.min(total, 5000))}</span>
              </a>
            )}
          </div>
          <ol className="border-t border-rule">
            {hits.map((h) => {
              const href = h.kind === "patent" ? `/patent/${h.id}` : `/award/${h.id}`;
              const names = h.university_ids.map((id) => uniName.get(id)).filter(Boolean) as string[];
              const isSystem = h.kind === "patent" && names.length > 3;
              const where = isSystem ? systemLabel(names) : names.slice(0, 2).join(", ");
              return (
                <li key={h.kind + h.id} className="py-6 border-b border-rule">
                  <div className="flex items-center gap-4 mb-2 flex-wrap">
                    <ProgramTag program={h.program} />
                    {h.has_lineage && <LineageBadge />}
                    <Meta>
                      {date(h.date)}
                      {h.amount ? ` · ${money(h.amount)}` : ""}
                    </Meta>
                    <span className="flex items-center gap-2 ml-auto">
                      {h.climate && <TopicChip>{(h.climate_sub && LENSES.climate.subs[h.climate_sub]) || "Climate"}</TopicChip>}
                      {h.agtech && <TopicChip>{(h.ag_sub && LENSES.agtech.subs[h.ag_sub]) || "Ag tech"}</TopicChip>}
                      <ReadinessBadge value={h.readiness} />
                    </span>
                  </div>
                  <Link href={href} className="group">
                    <h3 className="font-serif text-[22px] leading-7 group-hover:text-accent">
                      <Highlight text={cleanTitle(h.title)} q={q} />
                    </h3>
                  </Link>
                  {(where || (h.kind === "award" && h.pi)) && (
                    <p className="mt-1 text-[14px] font-medium text-ink-2">
                      {where}
                      {h.kind === "award" && h.pi && (
                        <span className="font-normal text-ink-3">
                          {where ? " · " : ""}PI {h.pi} <Email address={h.pi_email} className="ml-1" />
                        </span>
                      )}
                    </p>
                  )}
                  {h.snippet && (
                    <p className="mt-2 text-[15px] leading-6 text-ink-2 line-clamp-2 max-w-[68ch]">
                      <Highlight text={decode(h.snippet)} q={q} />
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
          {total > PER && (
            <nav className="flex items-center justify-between py-8 text-[14px] font-medium">
              {page > 1 ? <Link href={pageHref(page - 1)} className="hover:text-accent">← Previous</Link> : <span />}
              <Meta>Page {page} of {Math.ceil(total / PER)}</Meta>
              {page * PER < total ? <Link href={pageHref(page + 1)} className="hover:text-accent">Next →</Link> : <span />}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

function LensLink({ href, label, n }: { href: string; label: string; n: number }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-3 h-10 pl-4 pr-3 rounded-[2px] border border-rule hover:border-accent text-[14px] font-medium">
      {label}
      <span className="font-mono text-[12px] text-ink-3 tnum group-hover:text-accent">{num(n)} →</span>
    </Link>
  );
}

function systemLabel(names: string[]) {
  if (names.some((n) => n.startsWith("University of California"))) return "University of California system";
  if (names.some((n) => n.startsWith("University of Texas"))) return "University of Texas system";
  return `${names[0]} and ${names.length - 1} more`;
}

