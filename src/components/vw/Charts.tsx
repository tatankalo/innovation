import Link from "next/link";
import { money, num } from "@/lib/format";

/** Big editorial figure: serif number, short label, one-line note. */
export function Figure({ n, label, sub, accent }: { n: string; label: string; sub?: string; accent?: boolean }) {
  return (
    <div className="py-7 pr-6">
      <div className={`font-serif text-[40px] sm:text-[52px] leading-none tracking-[-0.02em] tnum ${accent ? "text-accent" : ""}`}>{n}</div>
      <div className="mt-3 text-[15px] font-medium">{label}</div>
      {sub && <div className="mt-1 text-[13px] text-ink-3 max-w-[30ch]">{sub}</div>}
    </div>
  );
}

type Fig = { n: string; label: string; sub?: string; accent?: boolean };
export function FigureRow({ items }: { items: Fig[] }) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 border-t border-b border-rule">
      {items.map((f, i) => (
        <div key={f.label} className={`${i % 2 ? "pl-6 border-l border-rule" : ""} ${i === 2 ? "lg:pl-6 lg:border-l border-rule" : ""} ${i > 1 ? "border-t lg:border-t-0 border-rule" : ""}`}>
          <Figure {...f} />
        </div>
      ))}
    </section>
  );
}

/** Single-series horizontal bars. One hue, values in ink, native tooltip on each row. */
export function BarList({
  rows,
  color = "var(--ink)",
  format = num,
  max,
}: {
  rows: { label: string; value: number; note?: string; href?: string; tip?: string }[];
  color?: string;
  format?: (n: number) => string;
  max?: number;
}) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r) => {
        const label = r.href ? (
          <Link href={r.href} className="hover:text-accent">{r.label}</Link>
        ) : (
          r.label
        );
        return (
          <li key={r.label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 items-baseline" title={r.tip ?? `${r.label}: ${format(r.value)}`}>
            <span className="text-[14px] truncate">{label}</span>
            <span className="font-mono text-[12px] text-ink-2 tnum">
              {format(r.value)}
              {r.note && <span className="text-ink-3"> · {r.note}</span>}
            </span>
            <span className="col-span-2 mt-1.5 h-[8px] bg-rule/50 rounded-[4px] overflow-hidden">
              <span className="block h-full rounded-[4px]" style={{ width: `${Math.max(1.5, (r.value / top) * 100)}%`, background: color }} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Single-series columns by year. Baseline-anchored, rounded data end, value on hover and under the last bar. */
export function Columns({
  data,
  color = "var(--ink)",
  format = num,
  partialLast,
}: {
  data: { label: string; value: number }[];
  color?: string;
  format?: (n: number) => string;
  partialLast?: boolean;
}) {
  const top = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="flex items-end gap-2 h-[150px] border-b border-rule">
        {data.map((d, i) => {
          const partial = partialLast && i === data.length - 1;
          return (
            <div key={d.label} className="flex-1 flex flex-col items-center justify-end h-full group" title={`${d.label}: ${format(d.value)}${partial ? " (year to date)" : ""}`}>
              <span className="font-mono text-[11px] text-ink-3 tnum mb-1 opacity-0 group-hover:opacity-100 print:opacity-100 transition-opacity duration-150">{format(d.value)}</span>
              <span
                className="w-full max-w-[44px] rounded-t-[4px]"
                style={{
                  height: `${(d.value / top) * 120}px`,
                  background: partial ? `repeating-linear-gradient(135deg, ${color} 0 3px, transparent 3px 6px)` : color,
                  boxShadow: partial ? `inset 0 0 0 1.5px ${color}` : undefined,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-2">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center font-mono text-[11px] text-ink-3 tnum">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

/** Four-step readiness distribution as one segmented bar with a legend table. */
export function ReadinessSplit({ counts, color = "var(--ink)" }: { counts: number[]; color?: string }) {
  const labels = ["Basic science", "Applied research", "Prototype", "Near market"];
  const total = counts.reduce((a, b) => a + b, 0) || 1;
  const opacity = [0.25, 0.5, 0.75, 1];
  return (
    <div>
      <div className="flex h-[14px] gap-[2px]">
        {counts.map((c, i) => (
          <span key={i} title={`${labels[i]}: ${num(c)}`} className="h-full first:rounded-l-[4px] last:rounded-r-[4px]" style={{ width: `${Math.max(0.8, (c / total) * 100)}%`, background: color, opacity: opacity[i] }} />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
        {counts.map((c, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-[10px] h-[10px] rounded-[2px]" style={{ background: color, opacity: opacity[i] }} aria-hidden />
            <span className="text-ink-2">{labels[i]}</span>
            <span className="ml-auto font-mono text-[12px] tnum">{num(c)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const usd = (n: number) => money(n) || "$0";
