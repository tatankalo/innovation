import { rpc } from "@/lib/supabase";
import { searchArgs } from "@/lib/searchParams";
import { cleanTitle, googlePatentUrl, LENSES, nsfUrl, PROGRAMS, READINESS, readinessLevel, SECTORS } from "@/lib/format";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PAGE = 1000;
const CAP = 5000;

type Row = {
  kind: "patent" | "award";
  id: string;
  ref: string;
  title: string;
  program: string;
  date: string | null;
  university_ids: number[];
  states: string[] | null;
  awardee: string | null;
  amount: number | null;
  has_lineage: boolean;
  pi: string | null;
  pi_email: string | null;
  co_pi_contacts: { name: string; email: string | null }[] | null;
  sector: string | null;
  climate: boolean;
  agtech: boolean;
  climate_sub: string | null;
  ag_sub: string | null;
  readiness: number | null;
};

/** RFC 4180 quoting, plus a guard so spreadsheet apps never treat a cell as a formula. */
function cell(v: unknown): string {
  if (v == null) return "";
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function universityLabel(names: string[]) {
  if (names.length > 4 && names.some((n) => n.startsWith("University of California"))) return "University of California system";
  if (names.length > 4 && names.some((n) => n.startsWith("University of Texas"))) return "University of Texas system";
  return names.join("; ");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const args = searchArgs((k) => url.searchParams.get(k));
  const unis = await rpc<{ id: number; name: string }[]>("list_universities");
  const uniName = new Map(unis.map((u) => [u.id, u.name]));

  const rows: Row[] = [];
  let total = 0;
  for (let off = 0; off < CAP; off += PAGE) {
    const res = await rpc<{ total: number; hits: Row[] }>("search_v2", { ...args, lim: PAGE, off }, { cache: false });
    total = res.total;
    rows.push(...res.hits);
    if (res.hits.length < PAGE || rows.length >= total) break;
  }

  const header = [
    "type", "program", "title", "university", "state", "year", "date", "amount_usd",
    "pi_name", "pi_email", "co_pi_contacts", "readiness_score", "readiness", "sector",
    "climate_topic", "ag_topic", "has_lineage", "unshelved_url", "source_url", "id",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    const names = r.university_ids.map((id) => uniName.get(id)).filter(Boolean) as string[];
    const lvl = readinessLevel(r.readiness);
    lines.push(
      [
        r.kind === "patent" ? "Patent" : "NSF award",
        PROGRAMS[r.program]?.label ?? r.program,
        cleanTitle(r.title),
        universityLabel(names) || r.awardee || "",
        (r.states ?? []).join("; "),
        r.date ? r.date.slice(0, 4) : "",
        r.date ?? "",
        r.amount ?? "",
        r.pi ?? "",
        r.pi_email ?? "",
        (r.co_pi_contacts ?? []).map((c) => (c.email ? `${c.name} <${c.email}>` : c.name)).join("; "),
        r.readiness != null ? r.readiness.toFixed(2) : "",
        lvl != null ? READINESS[lvl] : "",
        r.sector ? SECTORS[r.sector] ?? r.sector : "",
        r.climate ? (r.climate_sub && LENSES.climate.subs[r.climate_sub]) || "Climate" : "",
        r.agtech ? (r.ag_sub && LENSES.agtech.subs[r.ag_sub]) || "Ag tech" : "",
        r.has_lineage ? "yes" : "",
        `${url.origin}/${r.kind === "patent" ? "patent" : "award"}/${r.id}`,
        r.kind === "patent" ? googlePatentUrl(r.ref) : nsfUrl(r.id),
        r.kind === "patent" ? r.ref : r.id,
      ]
        .map(cell)
        .join(",")
    );
  }

  const slug =
    (args.q || args.lens || (args.kinds ?? []).join("-") || "all")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "all";
  const day = new Date().toISOString().slice(0, 10);
  // BOM so Excel reads UTF-8; CRLF line ends per RFC 4180.
  return new Response("﻿" + lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="unshelved-${slug}-${day}.csv"`,
      "Cache-Control": "no-store",
      "X-Total-Matches": String(total),
      "X-Exported-Rows": String(rows.length),
    },
  });
}
