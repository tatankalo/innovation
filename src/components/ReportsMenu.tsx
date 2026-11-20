"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Every report-style page in one place. Add new briefs here. */
const GROUPS: { title: string; links: { href: string; label: string; note: string }[] }[] = [
  {
    title: "For leadership",
    links: [
      { href: "/pipeline", label: "NSF pipeline", note: "Where research drops off before market" },
      { href: "/venturewell", label: "VentureWell overview", note: "Strategy figures and recruiting targets" },
      { href: "/landscape", label: "Landscape", note: "Where NSF invests and patents land" },
    ],
  },
  {
    title: "Topic briefs",
    links: [
      { href: "/report/womens-health", label: "Women's health", note: "Awards, teams, companies and patents" },
      { href: "/report/health", label: "Health", note: "Health technology funder brief" },
      { href: "/report/climate", label: "Climate", note: "Climate and clean energy funder brief" },
      { href: "/report/agtech", label: "Ag tech", note: "Agriculture and food funder brief" },
      { href: "/report/ocean", label: "Ocean", note: "Ocean and coastal funder brief" },
    ],
  },
];

export default function ReportsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const path = usePathname();
  const active = GROUPS.some((g) => g.links.some((l) => path === l.href));

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`inline-flex items-center gap-1.5 hover:text-band-ink ${active || open ? "text-band-ink" : ""}`}
      >
        Reports
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>
      {open && (
        <div className="fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+14px)] z-50 sm:w-[560px] bg-surface text-ink border border-rule shadow-lg rounded-[2px] p-5 grid sm:grid-cols-2 gap-x-8 gap-y-5 whitespace-normal">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <p className="label mb-2">{g.title}</p>
              <ul>
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className={`block py-2 group ${path === l.href ? "text-accent" : ""}`}
                    >
                      <span className="block text-[15px] font-semibold group-hover:text-accent">{l.label}</span>
                      <span className="block text-[12px] font-normal text-ink-3">{l.note}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
