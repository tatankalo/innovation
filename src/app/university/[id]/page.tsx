import Link from "next/link";
import { notFound } from "next/navigation";
import { rpc, supabase } from "@/lib/supabase";
import { cleanTitle, date, inventorName, money, num, PROGRAMS } from "@/lib/format";
import { Email, Meta, ProgramTag, SectionLabel } from "@/components/ui";

export const dynamic = "force-dynamic";

type Profile = {
  university: { id: number; name: string; state: string | null; edu_domains: string[] | null; sttr_partner_awards: number | null } | null;
  patent_families: number;
  exact_families: number;
  granted_families: number;
  award_counts: Record<string, number>;
  award_dollars: number;
  lineage_links: number;
  topics: { climate_awards: number; agtech_awards: number; climate_patents: number; agtech_patents: number; tagged: number };
  cpc_sections: { code: string; name: string; n: number }[];
  cpc_classes: { code: string; n: number }[];
  years: Record<string, number>;
  recent_patents: { family_id: string; rep_number: string; title: string; first_pub: string; has_grant: boolean; inventors: string[]; exact: boolean }[];
  recent_awards: { id: string; program: string; title: string; pi_name: string; pi_email?: string | null; start_date: string; amount: number }[];
  top_inventors: { name: string; n: number }[];
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await rpc<Profile>("university_profile", { uid: Number(id) });
  return { title: p.university ? `${p.university.name} · Unshelved` : "Unshelved" };
}

export default async function UniversityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const uid = Number(id);
  if (!Number.isFinite(uid)) notFound();
  const [p, centerRes] = await Promise.all([
    rpc<Profile>("university_profile", { uid }),
    supabase.from("iucrc_center_awards").select("award_id, center, pi_name, start_date, n_pubs, iucrc_centers(name)").eq("university_id", uid).order("start_date", { ascending: false }),
  ]);
  if (!p.university) notFound();
  const centers = (centerRes.data ?? []) as unknown as { award_id: string; center: string; pi_name: string | null; start_date: string | null; n_pubs: number; iucrc_centers: { name: string | null } | null }[];
  const u = p.university;
  const awardsTotal = Object.values(p.award_counts).reduce((a, b) => a + b, 0);
  const systemOnly = p.patent_families > 0 && p.exact_families === 0;
  const maxSec = Math.max(1, ...p.cpc_sections.map((s) => s.n));
  const years = [2021, 2022, 2023, 2024, 2025, 2026];
  const maxYear = Math.max(1, ...years.map((y) => p.years[y] ?? 0));

  return (
    <div className="@container mx-auto max-w-[1120px] px-4 sm:px-8 pt-12">
      <Link data-back-link href="/universities" className="text-[14px] text-ink-3 hover:text-ink">← Universities</Link>
      <header className="mt-8 pb-10 border-b border-rule">
        <p className="label mb-4">University{u.state ? ` · ${u.state}` : ""}</p>
        <h1 className="font-serif text-[40px] leading-[46px] sm:text-[56px] sm:leading-[60px] tracking-[-0.02em] max-w-[900px]">{u.name}</h1>
        <div className="mt-6 flex gap-6 text-[14px] font-medium">
          <Link href={`/?u=${u.id}`} className="text-accent hover:underline underline-offset-4">Search everything from {shortName(u.name)} →</Link>
        </div>
      </header>

      <section className="grid grid-cols-2 @4xl:grid-cols-4 border-b border-rule">
        <Figure n={num(p.patent_families)} label="Patent families" sub={systemOnly ? "Matched at system level" : `${num(p.granted_families)} granted`} />
        <Figure n={num(awardsTotal)} label="NSF awards" sub="Research, I-Corps, IUCRC" border />
        <Figure n={money(p.award_dollars)} label="NSF funding" sub="Total award amounts" border topBorder />
        <Figure n={num(p.lineage_links)} label="Lineage links" sub="Award team on a patent" border topBorder accent />
      </section>

      <div className="grid @4xl:grid-cols-2 gap-12 @4xl:gap-16 mt-14">
        <section>
          <SectionLabel>Awards by program</SectionLabel>
          <ul className="space-y-3">
            {["research", "icorps", "iucrc"].map((k) => (
              <li key={k} className="flex items-center justify-between">
                <Link href={`/?u=${u.id}&t=${k}`} className="hover:text-accent"><ProgramTag program={k} /></Link>
                <span className="font-serif text-[24px] tnum">{num(p.award_counts[k] ?? 0)}</span>
              </li>
            ))}
            <li className="flex items-center justify-between">
              <span className="flex items-baseline gap-2"><ProgramTag program="sttr" /><span className="text-[12px] text-ink-3">as research partner</span></span>
              <span className="font-serif text-[24px] tnum">{num(u.sttr_partner_awards ?? 0)}</span>
            </li>
          </ul>
          <div className="mt-12">
            <SectionLabel right={`${num(p.topics.tagged)} records tagged`}>Topic lenses</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              {([["climate", "Climate", p.topics.climate_awards, p.topics.climate_patents], ["agtech", "Ag tech", p.topics.agtech_awards, p.topics.agtech_patents]] as const).map(([k, label, aw, pt]) => (
                <Link key={k} href={`/?u=${u.id}&l=${k}&o=readiness`} className="group block border border-rule hover:border-accent rounded-[2px] p-4">
                  <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-2 group-hover:text-accent">{label}</div>
                  <div className="mt-2 font-serif text-[32px] leading-none tnum">{num(aw + pt)}</div>
                  <div className="mt-2 text-[13px] text-ink-3">{num(aw)} awards · {num(pt)} patents</div>
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-12">
            <SectionLabel right="First publication year">Patent families per year</SectionLabel>
            <div className="flex items-end gap-3 h-32">
              {years.map((y) => {
                const n = p.years[y] ?? 0;
                return (
                  <div key={y} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                    <Meta>{num(n)}</Meta>
                    <div className="w-full bg-ink rounded-[1px]" style={{ height: `${Math.max(2, (n / maxYear) * 88)}px` }} />
                    <Meta>{y}</Meta>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section>
          <SectionLabel>Top technology areas</SectionLabel>
          {p.cpc_sections.length === 0 ? (
            <p className="text-ink-2">No patents matched yet.</p>
          ) : (
            <ul className="space-y-3">
              {p.cpc_sections.map((s) => (
                <li key={s.code}>
                  <div className="flex justify-between text-[15px] mb-1">
                    <span><span className="font-mono text-[12px] text-ink-3 mr-2">{s.code}</span>{s.name}</span>
                    <span className="font-mono text-[12px] text-ink-3 tnum">{num(s.n)}</span>
                  </div>
                  <div className="h-1.5 bg-rule rounded-full overflow-hidden">
                    <div className="h-full bg-ink" style={{ width: `${(s.n / maxSec) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {p.top_inventors.length > 0 && (
            <div className="mt-12">
              <SectionLabel>Most active inventors</SectionLabel>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-[15px]">
                {p.top_inventors.map((i) => (
                  <li key={i.name} className="flex justify-between gap-2">
                    <span className="truncate">{inventorName(i.name)}</span>
                    <span className="font-mono text-[12px] text-ink-3 tnum">{i.n}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      {centers.length > 0 && (
        <section className="mt-16">
          <SectionLabel right={<Link href="/centers" className="hover:text-ink">All centers →</Link>}>IUCRC centers at this university</SectionLabel>
          <ul className="grid @3xl:grid-cols-2 gap-x-12">
            {centers.map((c) => (
              <li key={c.award_id} className="py-4 border-b border-rule">
                <Link href={`/center/${encodeURIComponent(c.center)}`} className="font-serif text-[19px] leading-6 hover:text-accent">
                  <span className="font-mono text-[12px] font-semibold text-accent mr-2">{c.center}</span>
                  {c.iucrc_centers?.name ?? c.center}
                </Link>
                <p className="mt-1 text-[13px] text-ink-3">
                  {c.pi_name ? `PI ${c.pi_name} · ` : ""}since {date(c.start_date)}{c.n_pubs ? ` · ${c.n_pubs} papers on this site's award` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid @4xl:grid-cols-2 gap-12 @4xl:gap-16 mt-16">
        <section>
          <SectionLabel right={<Link href={`/?u=${u.id}&t=patent`} className="hover:text-ink">All patents →</Link>}>Recent patents</SectionLabel>
          <ul>
            {p.recent_patents.map((r) => (
              <li key={r.family_id} className="py-4 border-b border-rule first:pt-0">
                <Meta>{r.has_grant ? "Granted" : "Published"} · {date(r.first_pub)}{!r.exact ? " · System match" : ""}</Meta>
                <Link href={`/patent/${r.family_id}`} className="block mt-1 font-serif text-[19px] leading-6 hover:text-accent">{cleanTitle(r.title)}</Link>
                <p className="mt-1 text-[13px] text-ink-3">{r.inventors.map(inventorName).join(", ")}</p>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <SectionLabel right={<Link href={`/?u=${u.id}&t=research,icorps,iucrc`} className="hover:text-ink">All awards →</Link>}>Recent NSF awards</SectionLabel>
          <ul>
            {p.recent_awards.map((r) => (
              <li key={r.id} className="py-4 border-b border-rule first:pt-0">
                <Meta>{PROGRAMS[r.program]?.label} · {date(r.start_date)} · {money(r.amount)}</Meta>
                <Link href={`/award/${r.id}`} className="block mt-1 font-serif text-[19px] leading-6 hover:text-accent">{cleanTitle(r.title)}</Link>
                <p className="mt-1 text-[13px] text-ink-3">PI {r.pi_name} <Email address={r.pi_email} className="ml-1" /></p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Figure({ n, label, sub, border, topBorder, accent }: { n: string; label: string; sub: string; border?: boolean; topBorder?: boolean; accent?: boolean }) {
  return (
    <div className={`py-8 pr-6 ${border ? "pl-6 border-l border-rule" : ""} ${topBorder ? "border-t @4xl:border-t-0 border-rule" : ""} [&:nth-child(3)]:pl-0 [&:nth-child(3)]:border-l-0 @4xl:[&:nth-child(3)]:pl-6 @4xl:[&:nth-child(3)]:border-l`}>
      <div className={`font-serif text-[40px] sm:text-[48px] leading-none tracking-[-0.02em] tnum ${accent ? "text-accent" : ""}`}>{n}</div>
      <div className="mt-3 text-[15px] font-medium">{label}</div>
      <div className="mt-1 text-[13px] text-ink-3">{sub}</div>
    </div>
  );
}

function shortName(n: string) {
  return n.replace(/^(The )?(Regents of the )?/i, "").replace(/ - .*$/, "");
}
