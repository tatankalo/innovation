import { LENSES, nsfUrl, READINESS, readinessLevel, SECTORS } from "@/lib/format";
import { getShortlist, parseSegment, parseTopic, uniLabel } from "@/lib/vw";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PAGE = 1000;
const CAP = 5000;

/** RFC 4180 quoting, plus a guard so spreadsheet apps never treat a cell as a formula. */
function cell(v: unknown): string {
  if (v == null) return "";
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const topic = parseTopic(url.searchParams.get("topic"));
  const seg = parseSegment(url.searchParams.get("seg"));
  const msi = url.searchParams.get("msi") === "1";

  const rows = [];
  let total = 0;
  for (let off = 0; off < CAP; off += PAGE) {
    const res = await getShortlist({ topic, seg, msi, lim: PAGE, off }, { cache: false });
    total = res.total;
    rows.push(...res.rows);
    if (res.rows.length < PAGE || rows.length >= total) break;
  }

  const header = [
    "name", "role", "email", "university", "state", "hbcu", "epscor", "readiness", "readiness_score",
    "patent_families", "latest_patent", "nsf_awards", "nsf_dollars", "latest_award", "has_icorps", "has_iucrc",
    "sector", "climate_topics", "ag_topics", "best_award_title", "best_award_nsf_url", "unshelved_url",
  ];
  const lines = [header.join(",")];
  for (const p of rows) {
    const lvl = readinessLevel(p.max_readiness);
    lines.push(
      [
        p.name,
        p.is_pi ? "PI" : "Co-PI",
        p.email,
        uniLabel(p.university),
        p.state,
        p.hbcu ? "yes" : "",
        p.epscor ? "yes" : "",
        lvl != null ? READINESS[lvl] : "",
        p.max_readiness != null ? p.max_readiness.toFixed(2) : "",
        p.n_patents,
        p.last_patent,
        p.n_awards,
        p.total_dollars,
        p.last_award,
        p.has_icorps ? "yes" : "",
        p.has_iucrc ? "yes" : "",
        p.sector ? SECTORS[p.sector] ?? p.sector : "",
        (p.climate_subs ?? []).map((s) => LENSES.climate.subs[s] ?? s).join("; "),
        (p.ag_subs ?? []).map((s) => LENSES.agtech.subs[s] ?? s).join("; "),
        p.award_title,
        p.award_id ? nsfUrl(p.award_id) : "",
        p.award_id ? `${url.origin}/award/${p.award_id}` : "",
      ]
        .map(cell)
        .join(",")
    );
  }
  const day = new Date().toISOString().slice(0, 10);
  const slug = [seg, topic, msi ? "msi-epscor" : ""].filter(Boolean).join("-");
  return new Response("﻿" + lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="unshelved-shortlist-${slug}-${day}.csv"`,
      "Cache-Control": "no-store",
      "X-Total-Matches": String(total),
      "X-Exported-Rows": String(rows.length),
    },
  });
}
