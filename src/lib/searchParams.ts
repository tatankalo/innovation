import { LENSES } from "@/lib/format";

/** One place that turns URL params into search_v2 arguments, shared by the page and the CSV export. */
export function searchArgs(get: (k: string) => string | undefined | null) {
  const t = (get("t") ?? "").split(",").filter(Boolean);
  const l = get("l");
  const lens = l && LENSES[l] ? l : null;
  const u = get("u");
  const yf = get("yf");
  const yt = get("yt");
  return {
    q: get("q") ?? "",
    kinds: t.length ? t : null,
    university: u ? Number(u) : null,
    st: get("s") || null,
    year_from: yf ? Number(yf) : null,
    year_to: yt ? Number(yt) : null,
    lens,
    sector: get("sec") || null,
    sub: (lens && get("sub")) || null,
    sort: get("o") ?? "relevance",
  };
}
