"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { cleanTitle, googlePatentUrl, money, num } from "@/lib/format";
import { type WhAward, type WhPatent, type WhPerson, type WhTheme } from "@/lib/womens-health";

export type ThemeRow = { key: WhTheme; label: string; note: string; research: number; icorps: number; sbir: number; dollars: number; patents: number };

const usd = (n: number) => money(n) || "$0";

/** The theme table on the women's health brief. Clicking a row opens a side sheet with that theme's records. */
export default function WhThemeTable({ rows, awards, patents, people }: { rows: ThemeRow[]; awards: WhAward[]; patents: WhPatent[]; people: WhPerson[] }) {
  const [open, setOpen] = useState<WhTheme | null>(null);
  const row = rows.find((r) => r.key === open) ?? null;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-[14px] border-collapse">
          <thead>
            <tr className="text-left text-[12px] uppercase tracking-[0.06em] text-ink-3 border-b border-rule">
              <th className="py-2 pr-3 font-semibold">Theme</th>
              <th className="py-2 px-2 font-semibold text-right">Research</th>
              <th className="py-2 px-2 font-semibold text-right">I-Corps</th>
              <th className="py-2 px-2 font-semibold text-right">SBIR/STTR</th>
              <th className="py-2 px-2 font-semibold text-right">NSF $</th>
              <th className="py-2 pl-2 font-semibold text-right">Patents</th>
              <th className="py-2 pl-2 w-6 no-print" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr
                key={t.key}
                onClick={() => setOpen(t.key)}
                className="border-b border-rule align-top cursor-pointer hover:bg-wash group"
              >
                <td className="py-3 pr-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpen(t.key);
                    }}
                    className="text-left font-semibold group-hover:text-accent"
                  >
                    {t.label}
                  </button>
                  <span className="block text-[12px] text-ink-3">{t.note}</span>
                </td>
                <td className="py-3 px-2 text-right tnum">{num(t.research)}</td>
                <td className="py-3 px-2 text-right tnum">{num(t.icorps)}</td>
                <td className="py-3 px-2 text-right tnum">{num(t.sbir)}</td>
                <td className="py-3 px-2 text-right tnum">{usd(t.dollars)}</td>
                <td className="py-3 pl-2 text-right tnum">{num(t.patents)}</td>
                <td className="py-3 pl-2 text-right text-ink-3 group-hover:text-accent no-print" aria-hidden>→</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[13px] text-ink-3 no-print">Click a theme to see its teams, companies, researchers and patents.</p>
      {row && <ThemeSheet row={row} awards={awards} patents={patents} people={people} onClose={() => setOpen(null)} />}
    </>
  );
}

function ThemeSheet({ row, awards, patents, people, onClose }: { row: ThemeRow; awards: WhAward[]; patents: WhPatent[]; people: WhPerson[]; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);

  const d = useMemo(() => {
    const aw = awards.filter((a) => a.theme === row.key);
    const awardTheme = new Map(awards.map((a) => [a.id, a.theme]));
    const ppl = people.filter((p) => awardTheme.get(p.award) === row.key);
    const unis = new Map<string, { id: number | null; name: string; n: number }>();
    for (const a of aw.filter((x) => x.program === "research" || x.program === "icorps")) {
      const k = String(a.uni ?? a.org);
      const u = unis.get(k) ?? { id: a.uni, name: a.org ?? "Unknown", n: 0 };
      u.n++;
      unis.set(k, u);
    }
    return {
      icorps: aw.filter((a) => a.program === "icorps"),
      sbir: aw.filter((a) => a.program === "sbir" || a.program === "sttr"),
      research: aw.filter((a) => a.program === "research").sort((a, b) => b.amount - a.amount),
      invite: ppl.filter((p) => p.patents > 0 && !p.icorps),
      researchers: ppl.length,
      patents: patents.filter((p) => p.theme === row.key),
      unis: [...unis.values()].sort((a, b) => b.n - a.n).slice(0, 6),
    };
  }, [row, awards, patents, people]);

  useEffect(() => {
    const opener = document.activeElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    // A record sheet opened from here sits on top; let Esc close that one first.
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector("[data-sheet]") && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      if (opener instanceof HTMLElement) opener.focus({ preventScroll: true });
    };
  }, [onClose]);

  const btn = "h-9 w-9 inline-flex items-center justify-center rounded-[2px] border border-rule text-[18px] text-ink hover:border-ink";

  return (
    <div className="fixed inset-0 z-50 no-print">
      <div className="sheet-backdrop absolute inset-0 bg-black/45" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={row.label}
        tabIndex={-1}
        className="sheet-panel absolute inset-y-0 right-0 w-full sm:w-[min(720px,92vw)] bg-paper border-l border-rule shadow-[-20px_0_60px_rgba(0,0,0,0.25)] flex flex-col outline-none"
      >
        <div className="flex items-center gap-2 h-14 px-4 sm:px-6 border-b border-rule shrink-0">
          <span className="label">Women&apos;s health theme</span>
          <button className={`${btn} ml-auto`} onClick={onClose} aria-label="Close" title="Close (Esc)">×</button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-8 pt-8 pb-16">
          <h2 className="font-serif text-[32px] leading-[36px] sm:text-[40px] sm:leading-[44px]">{row.label}</h2>
          <p className="mt-2 text-[15px] text-ink-2">{row.note}</p>

          <div className="mt-6 grid grid-cols-3 sm:grid-cols-5 border-t border-b border-rule">
            {[
              [num(row.research), "Research awards"],
              [num(row.icorps), "I-Corps teams"],
              [num(row.sbir), "SBIR/STTR"],
              [usd(row.dollars), "NSF dollars"],
              [num(row.patents), "Patents"],
            ].map(([n, l], i) => (
              <div key={l} className={`py-4 ${i ? "pl-4 border-l border-rule" : ""} ${i === 3 ? "max-sm:pl-0 max-sm:border-l-0 max-sm:border-t" : ""} ${i === 4 ? "max-sm:border-t" : ""}`}>
                <p className="font-serif text-[26px] leading-none tnum">{n}</p>
                <p className="mt-1.5 text-[12px] text-ink-3">{l}</p>
              </div>
            ))}
          </div>

          {d.unis.length > 0 && (
            <p className="mt-5 text-[14px] leading-6 text-ink-2">
              <span className="font-semibold text-ink">Most active: </span>
              {d.unis.map((u, i) => (
                <span key={u.name}>
                  {i ? ", " : ""}
                  {u.id ? <Link href={`/university/${u.id}`} className="hover:text-accent">{u.name}</Link> : u.name}
                  <span className="text-ink-3"> ({u.n})</span>
                </span>
              ))}
            </p>
          )}

          <Block title="Pioneer invitations" sub={`${num(d.invite.length)} of ${num(d.researchers)} researchers hold patents and have not done I-Corps`}>
            {d.invite.map((p) => (
              <Item key={p.pid} title={p.name} href={null} meta={`${p.university} · ${num(p.patents)} patent ${p.patents === 1 ? "family" : "families"}`}>
                <Link href={`/award/${p.award}`} className="hover:text-accent">{cleanTitle(p.title)}</Link>
              </Item>
            ))}
          </Block>

          <Block title="I-Corps teams" sub="Tested a market with NSF. Propel and Aspire candidates.">
            {d.icorps.map((a) => (
              <Item key={a.id} title={cleanTitle(a.title)} href={`/award/${a.id}`} meta={`${a.org ?? ""}${a.pi ? ` · ${a.pi}` : ""} · ${a.start?.slice(0, 4)}`} />
            ))}
          </Block>

          <Block title="SBIR/STTR companies" sub="Won NSF small business funding.">
            {d.sbir.map((a) => (
              <Item key={a.id} title={cleanTitle(a.title)} href={`/award/${a.id}`} meta={`${a.org ?? ""} · ${usd(a.amount)} · ${a.start?.slice(0, 4)}`} />
            ))}
          </Block>

          <Block title="Research awards" sub="Largest first.">
            {d.research.slice(0, 15).map((a) => (
              <Item key={a.id} title={cleanTitle(a.title)} href={`/award/${a.id}`} meta={`${a.org ?? ""}${a.pi ? ` · ${a.pi}` : ""} · ${usd(a.amount)}`} />
            ))}
            {d.research.length > 15 && <p className="pt-3 text-[13px] text-ink-3">{num(d.research.length - 15)} more in the records list and CSV.</p>}
          </Block>

          <Block title="University patents" sub="Newest first.">
            {d.patents.slice(0, 15).map((p) => (
              <Item key={p.id} title={cleanTitle(p.title)} href={p.pub ? googlePatentUrl(p.pub) : null} external meta={`${p.unis ?? ""} · ${p.year}`} />
            ))}
            {d.patents.length > 15 && <p className="pt-3 text-[13px] text-ink-3">{num(d.patents.length - 15)} more in the records list and CSV.</p>}
          </Block>
        </div>
      </div>
    </div>
  );
}

function Block({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  const empty = !(Array.isArray(children) ? children.flat().filter(Boolean).length : children);
  return (
    <section className="mt-9">
      <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-2">
        <h3 className="label">{title}</h3>
        <span className="text-[12px] text-ink-3 text-right">{sub}</span>
      </div>
      {empty ? <p className="py-3 text-[14px] text-ink-3">None in this theme.</p> : <ul>{children}</ul>}
    </section>
  );
}

function Item({ title, href, meta, external, children }: { title: string; href: string | null; meta: string; external?: boolean; children?: React.ReactNode }) {
  return (
    <li className="py-3 border-b border-rule">
      {href ? (
        external ? (
          <a href={href} target="_blank" rel="noreferrer" className="text-[15px] font-semibold hover:text-accent">{title}</a>
        ) : (
          <Link href={href} className="text-[15px] font-semibold hover:text-accent">{title}</Link>
        )
      ) : (
        <span className="text-[15px] font-semibold">{title}</span>
      )}
      {children && <span className="block text-[14px] text-ink-2 mt-0.5">{children}</span>}
      <span className="block text-[12px] text-ink-3 mt-0.5">{meta}</span>
    </li>
  );
}

