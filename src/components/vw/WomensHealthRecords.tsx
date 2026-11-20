"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cleanTitle, googlePatentUrl, money, num } from "@/lib/format";
import { WH_ORDER, WH_THEMES, type WhAward, type WhPatent, type WhPerson, type WhTheme } from "@/lib/womens-health";

type Tab = "people" | "icorps" | "sbir" | "research" | "patents";
const TABS: [Tab, string][] = [
  ["people", "Researchers"],
  ["icorps", "I-Corps teams"],
  ["sbir", "SBIR/STTR companies"],
  ["research", "Research awards"],
  ["patents", "Patents"],
];
const btn = (on: boolean) => `h-9 px-4 rounded-[2px] border text-[14px] font-semibold ${on ? "bg-ink text-paper border-ink" : "border-rule hover:border-ink"}`;
const LIMIT = 60;

export default function WomensHealthRecords({ awards, patents, people }: { awards: WhAward[]; patents: WhPatent[]; people: WhPerson[] }) {
  const [tab, setTab] = useState<Tab>("icorps");
  const [theme, setTheme] = useState<WhTheme | "all">("all");
  const [more, setMore] = useState(false);
  const themeOf = useMemo(() => new Map(awards.map((a) => [a.id, a.theme])), [awards]);
  const keep = (t: WhTheme) => theme === "all" || t === theme;

  const lists = useMemo(() => {
    const aw = (p: (a: WhAward) => boolean) => awards.filter((a) => p(a) && keep(a.theme));
    return {
      icorps: aw((a) => a.program === "icorps"),
      sbir: aw((a) => a.program === "sbir" || a.program === "sttr"),
      research: aw((a) => a.program === "research"),
      patents: patents.filter((p) => keep(p.theme)),
      people: people.filter((p) => keep(themeOf.get(p.award) ?? "general")),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awards, patents, people, theme, themeOf]);

  const rows = lists[tab];
  const shown = more ? rows.length : LIMIT;

  return (
    <div>
      <div className="flex flex-wrap gap-2 no-print" role="tablist" aria-label="Record type">
        {TABS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setMore(false); }} className={btn(tab === k)}>
            {l} <span className="ml-1 font-normal opacity-70 tnum">{num(lists[k].length)}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[13px] no-print" aria-label="Theme">
        <span className="text-ink-3">Theme</span>
        {(["all", ...WH_ORDER] as const).map((k) => (
          <button key={k} onClick={() => { setTheme(k); setMore(false); }} className={`font-semibold ${theme === k ? "text-ink underline underline-offset-4" : "text-accent hover:underline underline-offset-4"}`}>
            {k === "all" ? "All" : WH_THEMES[k].label}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-[14px] border-collapse">
          <thead>
            <tr className="text-left text-[12px] uppercase tracking-[0.06em] text-ink-3 border-b border-rule">
              {tab === "people" ? (
                <>
                  <th className="py-2 pr-3 font-semibold">Researcher</th>
                  <th className="py-2 px-2 font-semibold">Women&apos;s health award</th>
                  <th className="py-2 px-2 font-semibold text-right">Patent families</th>
                  <th className="py-2 pl-2 font-semibold">I-Corps</th>
                </>
              ) : tab === "patents" ? (
                <>
                  <th className="py-2 pr-3 font-semibold">Invention</th>
                  <th className="py-2 px-2 font-semibold">University</th>
                  <th className="py-2 pl-2 font-semibold text-right">Year</th>
                </>
              ) : (
                <>
                  <th className="py-2 pr-3 font-semibold">Award</th>
                  <th className="py-2 px-2 font-semibold">{tab === "sbir" ? "Company" : "Institution and PI"}</th>
                  <th className="py-2 px-2 font-semibold text-right">Amount</th>
                  <th className="py-2 pl-2 font-semibold text-right">Start</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {tab === "people" &&
              (rows as WhPerson[]).slice(0, shown).map((p) => (
                <tr key={p.pid} className="border-b border-rule align-top">
                  <td className="py-2.5 pr-3">
                    <span className="font-semibold">{p.name}</span>
                    <span className="block text-[12px] text-ink-3">{p.university}{p.state ? ` · ${p.state}` : ""}</span>
                  </td>
                  <td className="py-2.5 px-2 text-ink-2">
                    <Link href={`/award/${p.award}`} className="hover:text-accent">{cleanTitle(p.title)}</Link>
                  </td>
                  <td className="py-2.5 px-2 text-right tnum">{p.patents ? num(p.patents) : ""}</td>
                  <td className="py-2.5 pl-2 text-[13px]">{p.icorps ? "Yes" : p.patents ? <span className="font-semibold text-brick">Not yet</span> : ""}</td>
                </tr>
              ))}
            {tab === "patents" &&
              (rows as WhPatent[]).slice(0, shown).map((p) => (
                <tr key={p.id} className="border-b border-rule align-top">
                  <td className="py-2.5 pr-3">
                    {p.pub ? (
                      <a href={googlePatentUrl(p.pub)} target="_blank" rel="noreferrer" className="hover:text-accent">{cleanTitle(p.title)}</a>
                    ) : (
                      cleanTitle(p.title)
                    )}
                    <span className="block text-[12px] text-ink-3">{WH_THEMES[p.theme].label}</span>
                  </td>
                  <td className="py-2.5 px-2 text-ink-2 text-[13px]">{p.unis}</td>
                  <td className="py-2.5 pl-2 text-right tnum">{p.year}</td>
                </tr>
              ))}
            {(tab === "icorps" || tab === "sbir" || tab === "research") &&
              (rows as WhAward[]).slice(0, shown).map((a) => (
                <tr key={a.id} className="border-b border-rule align-top">
                  <td className="py-2.5 pr-3">
                    <Link href={`/award/${a.id}`} className="hover:text-accent">{cleanTitle(a.title)}</Link>
                    <span className="block text-[12px] text-ink-3">{WH_THEMES[a.theme].label}</span>
                  </td>
                  <td className="py-2.5 px-2 text-ink-2 text-[13px]">
                    {a.uni ? <Link href={`/university/${a.uni}`} className="hover:text-accent">{a.org}</Link> : a.org}
                    {a.pi && <span className="block text-ink-3">{a.pi}</span>}
                  </td>
                  <td className="py-2.5 px-2 text-right tnum">{money(a.amount)}</td>
                  <td className="py-2.5 pl-2 text-right tnum text-ink-3">{a.start?.slice(0, 4)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <p className="mt-4 text-[14px] text-ink-3">No records in this theme.</p>}
      {rows.length > LIMIT && !more && (
        <button onClick={() => setMore(true)} className="mt-4 text-[14px] font-semibold text-accent no-print">
          Show all {num(rows.length)}
        </button>
      )}
    </div>
  );
}
