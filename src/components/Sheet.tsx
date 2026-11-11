"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/** Records listed on the page behind the sheet, in order, so the sheet can step through them. */
function listedRecords(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  document.querySelectorAll<HTMLAnchorElement>("main a[data-record]").forEach((a) => {
    const href = a.getAttribute("href");
    if (href && !seen.has(href)) {
      seen.add(href);
      out.push(href);
    }
  });
  return out;
}

export default function Sheet({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const [nav, setNav] = useState<{ prev: string | null; next: string | null; pos: string }>({ prev: null, next: null, pos: "" });

  const close = useCallback(() => router.back(), [router]);

  // Lock the page behind, remember what had focus, and hand focus back on close.
  useEffect(() => {
    opener.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      if (opener.current instanceof HTMLElement) opener.current.focus({ preventScroll: true });
    };
  }, []);

  // New record: back to the top, and work out its neighbours in the list behind.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
    const list = listedRecords();
    const i = list.indexOf(pathname);
    setNav(i < 0 ? { prev: null, next: null, pos: "" } : { prev: list[i - 1] ?? null, next: list[i + 1] ?? null, pos: `${i + 1} of ${list.length}` });
  }, [pathname]);

  const go = useCallback((href: string | null) => href && router.replace(href, { scroll: false }), [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      const typing = e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === "ArrowRight" || e.key === "j") go(nav.next);
        if (e.key === "ArrowLeft" || e.key === "k") go(nav.prev);
      }
      // Keep Tab inside the sheet.
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        const a = document.activeElement;
        if (!panel.current.contains(a)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && (a === first || a === panel.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && a === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close, go, nav]);

  const btn = "h-9 px-3 inline-flex items-center gap-2 rounded-[2px] border border-rule text-[13px] font-medium text-ink hover:border-ink disabled:text-ink-3 disabled:hover:border-rule";

  return (
    <div className="fixed inset-0 z-50" data-sheet>
      <div className="sheet-backdrop absolute inset-0 bg-black/45" onClick={close} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Record details"
        tabIndex={-1}
        className="sheet-panel absolute inset-y-0 right-0 w-full sm:w-[min(720px,92vw)] bg-paper border-l border-rule shadow-[-20px_0_60px_rgba(0,0,0,0.25)] flex flex-col outline-none"
      >
        <div className="flex items-center gap-2 h-14 px-4 sm:px-6 border-b border-rule shrink-0">
          {nav.pos && (
            <>
              <button className={btn} onClick={() => go(nav.prev)} disabled={!nav.prev} aria-label="Previous result" title="Previous result (left arrow)">←</button>
              <button className={btn} onClick={() => go(nav.next)} disabled={!nav.next} aria-label="Next result" title="Next result (right arrow)">→</button>
              <span className="font-mono text-[12px] text-ink-3 tnum ml-1">{nav.pos}</span>
            </>
          )}
          <a href={pathname} className={`${btn} ml-auto`} title="Open this record as a full page">
            Full page <span aria-hidden className="text-ink-3">↗</span>
          </a>
          <button className={`${btn} w-9 px-0 justify-center text-[18px]`} onClick={close} aria-label="Close" title="Close (Esc)">×</button>
        </div>
        <div ref={scroller} className="flex-1 overflow-y-auto overscroll-contain pb-16">
          {children}
        </div>
      </div>
    </div>
  );
}
