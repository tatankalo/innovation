import Link from "next/link";
import { PROGRAMS, READINESS, queryStems, readinessLevel } from "@/lib/format";

export function Highlight({ text, q }: { text: string; q?: string }) {
  const stems = q ? queryStems(q) : [];
  if (!stems.length) return <>{text}</>;
  const re = new RegExp(`\\b(${stems.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\w*`, "gi");
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    out.push(text.slice(last, m.index));
    out.push(<mark key={m.index}>{m[0]}</mark>);
    last = (m.index ?? 0) + m[0].length;
  }
  out.push(text.slice(last));
  return <>{out}</>;
}

function Glyph({ program }: { program: string }) {
  // Small geometric marks, one per source type.
  const common = { width: 9, height: 9, viewBox: "0 0 10 10", "aria-hidden": true } as const;
  switch (program) {
    case "patent":
      return <svg {...common}><rect x="1" y="1" width="8" height="8" fill="currentColor" /></svg>;
    case "research":
      return <svg {...common}><path d="M1 5h8M5 1v8" stroke="currentColor" strokeWidth="2" /></svg>;
    case "iucrc":
      return <svg {...common}><circle cx="5" cy="5" r="4" fill="currentColor" /></svg>;
    case "icorps":
      return <svg {...common}><path d="M5 1 9 9H1z" fill="currentColor" /></svg>;
    case "sbir":
      return <svg {...common}><path d="M5 0.5 9.5 5 5 9.5 0.5 5z" fill="currentColor" /></svg>;
    default:
      return <svg {...common}><circle cx="5" cy="5" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>;
  }
}

export function ProgramTag({ program }: { program: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">
      <Glyph program={program} />
      {PROGRAMS[program]?.label ?? program}
    </span>
  );
}

export function LineageBadge({ n }: { n?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-accent">
      <svg width="14" height="9" viewBox="0 0 14 9" aria-hidden>
        <circle cx="2.5" cy="4.5" r="2" fill="currentColor" />
        <path d="M4.5 4.5h5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="9.5" y="2.5" width="4" height="4" fill="currentColor" />
      </svg>
      Lineage{n ? ` · ${n}` : ""}
    </span>
  );
}

export function SectionLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between border-b border-rule pb-3 mb-6">
      <h2 className="label">{children}</h2>
      {right && <div className="text-[13px] text-ink-3">{right}</div>}
    </div>
  );
}

export function Meta({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[12px] leading-4 text-ink-3 tnum">{children}</span>;
}

export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 h-9 px-4 rounded-[2px] border border-rule hover:border-ink text-[14px] font-medium"
    >
      {children}
      <span aria-hidden className="text-ink-3">↗</span>
    </a>
  );
}

export function UniLink({ id, name }: { id: number; name: string }) {
  return (
    <Link href={`/university/${id}`} className="underline decoration-rule underline-offset-4 hover:decoration-ink">
      {name}
    </Link>
  );
}

/** Four-step meter: how close the work is to a product a customer could buy. */
export function ReadinessBadge({ value, showLabel = true }: { value?: number | null; showLabel?: boolean }) {
  const lvl = readinessLevel(value);
  if (lvl == null) return null;
  return (
    <span className="inline-flex items-center gap-2 text-[12px] text-ink-2" title={`Readiness ${value!.toFixed(1)} of 3: ${READINESS[lvl]}`}>
      <span className="inline-flex items-end gap-[2px]" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`w-[4px] rounded-[1px] ${i <= lvl ? "bg-ink" : "bg-rule"}`} style={{ height: 5 + i * 2 }} />
        ))}
      </span>
      {showLabel && <span className="font-medium">{READINESS[lvl]}</span>}
    </span>
  );
}

export function TopicChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center h-5 px-1.5 rounded-[2px] border border-rule text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-2">
      {children}
    </span>
  );
}
