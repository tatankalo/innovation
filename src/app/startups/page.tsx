import Link from "next/link";
import { rpc } from "@/lib/supabase";
import { cleanTitle, companyName as titleCase, date, money, num } from "@/lib/format";
import { Meta } from "@/components/ui";
import type { Spinout } from "@/lib/vw";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "University startups · Unshelved",
  description: "NSF SBIR and STTR companies tied to a university through their founder or lead researcher. Candidates for VentureWell Aspire.",
};

export default async function Startups() {
  const rows = await rpc<Spinout[]>("list_spinouts");
  const companies = new Set(rows.map((r) => r.company)).size;
  const unis = new Set(rows.map((r) => r.university_id)).size;
  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-8 pt-12">
      <Link data-back-link href="/venturewell" className="text-[14px] text-ink-3 hover:text-ink">← For VentureWell</Link>
      <p className="eyebrow mt-8 mb-4">Aspire candidates</p>
      <h1 className="font-serif text-[40px] leading-[46px] sm:text-[52px] sm:leading-[58px] max-w-[900px]">
        {num(companies)} startups with a university behind them.
      </h1>
      <p className="mt-5 text-[17px] leading-7 text-ink-2 max-w-[70ch]">
        Each company holds an NSF SBIR or STTR award since 2021. Its PI or co-PI is a patent inventor or an NSF-funded
        researcher at a university in the same state. {num(unis)} universities in all. Names that appear at three or more
        universities are left out, so these are likely links, not confirmed spinouts.
      </p>
      <div className="mt-10 overflow-x-auto">
        <table className="w-full text-[15px] min-w-[760px]">
          <thead>
            <tr className="border-b border-rule text-left">
              <th className="label py-3 font-semibold">Company</th>
              <th className="label py-3 font-semibold">University link</th>
              <th className="label py-3 font-semibold text-right w-20">Awards</th>
              <th className="label py-3 font-semibold text-right w-24">NSF $</th>
              <th className="label py-3 font-semibold text-right w-28">Latest</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.company}-${r.university_id}`} className="border-b border-rule align-top">
                <td className="py-3 pr-4">
                  <Link href={`/award/${r.award_id}`} className="font-semibold hover:text-accent">{titleCase(r.company)}</Link>
                  <span className="ml-2 font-mono text-[11px] text-ink-3">{r.sttr ? "STTR" : "SBIR"}{r.state ? ` · ${r.state}` : ""}</span>
                  <p className="mt-0.5 text-[13px] text-ink-3 line-clamp-1">{cleanTitle(r.title)}</p>
                </td>
                <td className="py-3 pr-4">
                  <Link href={`/university/${r.university_id}`} className="hover:text-accent">{r.university}</Link>
                  <p className="mt-0.5 text-[13px] text-ink-3">{r.people} · {r.inventor ? "patent inventor" : "NSF PI"}</p>
                </td>
                <td className="py-3 text-right font-mono text-[13px] tnum">{r.awards}</td>
                <td className="py-3 text-right font-mono text-[13px] tnum">{money(r.dollars ?? 0)}</td>
                <td className="py-3 text-right"><Meta>{date(r.last_start)}</Meta></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
