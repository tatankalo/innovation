import Link from "next/link";
import { rpc } from "@/lib/supabase";
import { num } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "IUCRC centers · Unshelved" };

type Center = { acronym: string; name: string | null; sites: number; awards: number; papers: number; authors: number; latest: string | null };

export default async function Centers() {
  const rows = await rpc<Center[]>("list_centers");
  const papers = rows.reduce((a, r) => a + r.papers, 0);
  const authors = rows.reduce((a, r) => a + r.authors, 0);
  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-8 pt-12">
      <p className="label mb-4">NSF IUCRC</p>
      <h1 className="font-serif text-[44px] leading-[50px] tracking-[-0.02em]">{num(rows.length)} industry-university centers</h1>
      <p className="mt-4 text-ink-2 max-w-[680px]">
        Every IUCRC center with an award in the data, grouped across its university sites. Papers come from the NSF Public Access
        Repository, tied to each site&apos;s award number. Most co-authors on these papers are graduate students and postdocs.
      </p>
      <p className="mt-3 text-[14px] text-ink-3">{num(papers)} center papers · about {num(authors)} author credits</p>
      <div className="mt-10 overflow-x-auto">
        <table className="w-full text-[15px] min-w-[680px]">
          <thead>
            <tr className="border-b border-rule text-left">
              <th className="label py-3 font-semibold">Center</th>
              <th className="label py-3 font-semibold text-right w-20">Sites</th>
              <th className="label py-3 font-semibold text-right w-24">Papers</th>
              <th className="label py-3 font-semibold text-right w-24">Authors</th>
              <th className="label py-3 font-semibold text-right w-28">Latest award</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.acronym} className="border-b border-rule hover:bg-surface">
                <td className="py-3 pr-4">
                  <Link href={`/center/${encodeURIComponent(r.acronym)}`} className="hover:text-accent">
                    <span className="font-mono text-[12px] font-semibold text-accent mr-2">{r.acronym}</span>
                    {r.name ?? r.acronym}
                  </Link>
                </td>
                <td className="py-3 text-right font-mono text-[13px] tnum">{r.sites}</td>
                <td className="py-3 text-right font-mono text-[13px] tnum">{r.papers || ""}</td>
                <td className="py-3 text-right font-mono text-[13px] tnum">{r.authors || ""}</td>
                <td className="py-3 text-right font-mono text-[13px] text-ink-3">{r.latest?.slice(0, 4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
