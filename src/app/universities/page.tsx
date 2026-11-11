import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { money, num } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Universities · Unshelved" };

type Row = {
  id: number;
  name: string;
  state: string | null;
  iucrc_awards: number;
  icorps_awards: number;
  sttr_partner_awards: number;
  iucrc_icorps_dollars: number;
};

export default async function Universities() {
  const { data, error } = await supabase
    .from("universities")
    .select("id,name,state,iucrc_awards,icorps_awards,sttr_partner_awards,iucrc_icorps_dollars")
    .order("icorps_awards", { ascending: false })
    .order("iucrc_awards", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as Row[];

  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-8 pt-12">
      <p className="label mb-4">Directory</p>
      <h1 className="font-serif text-[44px] leading-[50px] tracking-[-0.02em]">{num(rows.length)} universities</h1>
      <p className="mt-4 text-ink-2 max-w-[620px]">Every school with an NSF IUCRC, I-Corps or STTR award since 2021. Ranked by I-Corps activity.</p>
      <div className="mt-10 overflow-x-auto">
        <table className="w-full text-[15px] min-w-[640px]">
          <thead>
            <tr className="border-b border-rule text-left">
              <th className="label py-3 font-semibold">University</th>
              <th className="label py-3 font-semibold w-16">State</th>
              <th className="label py-3 font-semibold text-right w-24">I-Corps</th>
              <th className="label py-3 font-semibold text-right w-24">IUCRC</th>
              <th className="label py-3 font-semibold text-right w-24">STTR</th>
              <th className="label py-3 font-semibold text-right w-32">IUCRC + I-Corps $</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-rule hover:bg-surface">
                <td className="py-3 pr-4">
                  <Link href={`/university/${r.id}`} className="hover:text-accent">{r.name}</Link>
                </td>
                <td className="py-3 font-mono text-[13px] text-ink-3">{r.state}</td>
                <td className="py-3 text-right font-mono text-[13px] tnum">{r.icorps_awards || ""}</td>
                <td className="py-3 text-right font-mono text-[13px] tnum">{r.iucrc_awards || ""}</td>
                <td className="py-3 text-right font-mono text-[13px] tnum">{r.sttr_partner_awards || ""}</td>
                <td className="py-3 text-right font-mono text-[13px] tnum">{money(r.iucrc_icorps_dollars)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
