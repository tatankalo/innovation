import { cleanTitle, googlePatentUrl, nsfUrl } from "@/lib/format";
import { getWomensHealth, WH_THEMES } from "@/lib/womens-health";

export const dynamic = "force-dynamic";

/** RFC 4180 quoting, plus a guard so spreadsheet apps never treat a cell as a formula. */
function cell(v: unknown): string {
  if (v == null) return "";
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const KIND: Record<string, string> = { research: "NSF research award", icorps: "NSF I-Corps team", sbir: "NSF SBIR award", sttr: "NSF STTR award" };

export async function GET() {
  const { data: r } = await getWomensHealth();
  const lines = [["record_type", "theme", "title", "institution_or_company", "pi", "amount_usd", "year", "link"].join(",")];
  for (const a of r.awards)
    lines.push([KIND[a.program] ?? a.program, WH_THEMES[a.theme].label, cleanTitle(a.title), a.org, a.pi, a.amount, a.start?.slice(0, 4), nsfUrl(a.id)].map(cell).join(","));
  for (const p of r.patents)
    lines.push(["University patent family", WH_THEMES[p.theme].label, cleanTitle(p.title), p.unis, "", "", p.year, p.pub ? googlePatentUrl(p.pub) : ""].map(cell).join(","));
  return new Response(lines.join("\r\n") + "\r\n", {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="unshelved-womens-health.csv"' },
  });
}
