import Link from "next/link";
import { Highlight, Meta } from "@/components/ui";

export type Paper = {
  key: string;
  title: string;
  journal: string | null;
  year: number | null;
  doi: string | null;
  par_id: string | null;
  authors: string[];
  centers?: string[];
  award_ids?: string[];
};

export function paperUrl(p: Paper) {
  return p.doi ?? (p.par_id ? `https://par.nsf.gov/biblio/${p.par_id}` : null);
}

/** "Rolland, Jannick P" -> "Jannick P Rolland". */
export function authorName(a: string) {
  const i = a.indexOf(",");
  return i > 0 ? `${a.slice(i + 1).trim()} ${a.slice(0, i).trim()}`.trim() : a;
}

function Authors({ list, max = 8 }: { list: string[]; max?: number }) {
  const shown = list.slice(0, max).map(authorName).join(", ");
  return (
    <p className="mt-1 text-[13px] leading-5 text-ink-3">
      {shown}
      {list.length > max && ` and ${list.length - max} more`}
    </p>
  );
}

function Item({ p, q, showCenters }: { p: Paper; q?: string; showCenters?: boolean }) {
  const url = paperUrl(p);
  return (
    <li className="py-4 border-b border-rule first:pt-0">
      <div className="flex items-center gap-3 flex-wrap">
        <Meta>
          {p.year ?? "Year not listed"}
          {p.journal ? ` · ${p.journal}` : ""}
        </Meta>
        {showCenters &&
          (p.centers ?? []).map((c) => (
            <Link key={c} href={`/center/${encodeURIComponent(c)}`} className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-accent hover:underline">
              {c}
            </Link>
          ))}
      </div>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="block mt-1 font-serif text-[19px] leading-6 hover:text-accent">
          <Highlight text={p.title} q={q} /> <span className="text-[13px] text-ink-3">↗</span>
        </a>
      ) : (
        <p className="mt-1 font-serif text-[19px] leading-6">
          <Highlight text={p.title} q={q} />
        </p>
      )}
      {p.authors.length > 0 && <Authors list={p.authors} />}
    </li>
  );
}

/** Paper list. Shows the first `initial` and folds the rest into a disclosure. */
export function PaperList({ papers, initial = 8, q, showCenters }: { papers: Paper[]; initial?: number; q?: string; showCenters?: boolean }) {
  const head = papers.slice(0, initial);
  const tail = papers.slice(initial);
  return (
    <>
      <ul>
        {head.map((p) => <Item key={p.key} p={p} q={q} showCenters={showCenters} />)}
      </ul>
      {tail.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none py-3 text-[14px] font-medium text-accent hover:underline underline-offset-4">
            <span className="group-open:hidden">Show {tail.length} more {tail.length === 1 ? "paper" : "papers"}</span>
            <span className="hidden group-open:inline">Show fewer</span>
          </summary>
          <ul>
            {tail.map((p) => <Item key={p.key} p={p} q={q} showCenters={showCenters} />)}
          </ul>
        </details>
      )}
    </>
  );
}
