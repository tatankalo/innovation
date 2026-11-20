import { supabase } from "@/lib/supabase";

/** Women's health landscape. Built by `select vw_build_womens_health();` (work/womens_health.sql), stored in vw_reports. */
export type WhTheme = "maternal" | "cancer" | "reproductive" | "newborn" | "menopause" | "general";
export const WH_THEMES: Record<WhTheme, { label: string; note: string }> = {
  maternal: { label: "Pregnancy and maternal health", note: "Preeclampsia, placenta, preterm birth, fetal monitoring, postpartum care" },
  cancer: { label: "Cancers in women", note: "Breast, ovarian, cervical and uterine cancer detection and treatment" },
  reproductive: { label: "Reproductive and gynecologic health", note: "Contraception, fertility, PCOS, endometriosis, pelvic floor, menstrual products" },
  newborn: { label: "Breastfeeding and newborn care", note: "Lactation, breast milk, neonatal monitoring" },
  menopause: { label: "Menopause and bone health", note: "Menopause symptoms, ovarian aging, osteoporosis" },
  general: { label: "Sex differences and general", note: "Sex-based biology, women's health platforms, intimate partner violence" },
};
export const WH_ORDER: WhTheme[] = ["maternal", "cancer", "reproductive", "newborn", "menopause", "general"];

export type WhAward = { id: string; program: string; theme: WhTheme; title: string; org: string | null; pi: string | null; uni: number | null; start: string; amount: number };
export type WhPatent = { id: string; title: string; year: number; pub: string | null; theme: WhTheme; unis: string | null };
export type WhPerson = { pid: number; name: string; uni: number; university: string; state: string | null; patents: number; icorps: boolean; award: string; title: string };
export type WomensHealth = {
  totals: {
    awards: number; dollars: number; research: number; research_dollars: number; icorps: number; sbir: number; sbir_dollars: number;
    patents: number; universities: number; researchers: number; inventors: number; inventors_no_icorps: number;
  };
  themes: { theme: WhTheme; research: number; icorps: number; sbir: number; dollars: number; patents: number }[];
  by_year: { yr: number; awards: number; dollars: number; patents: number }[];
  groups: Record<string, number>;
  top_unis: { id: number; name: string; state: string | null; awards: number; dollars: number; icorps: number; patents: number }[];
  awards: WhAward[];
  patents: WhPatent[];
  people: WhPerson[];
  iucrc_papers: { title: string; year: number; centers: string[]; doi: string | null }[];
};

let hit: { at: number; data: { data: WomensHealth; refreshed_at: string } } | null = null;
export async function getWomensHealth() {
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.data;
  const { data, error } = await supabase.from("vw_reports").select("data,refreshed_at").eq("topic", "womens_health").single();
  if (error) throw new Error(`vw_reports: ${error.message}`);
  hit = { at: Date.now(), data: data as { data: WomensHealth; refreshed_at: string } };
  return hit.data;
}

/** Health-related IUCRC centers (2026-11-20 review of all 109). None has a women's health focus. */
export const HEALTH_IUCRCS: [string, string][] = [
  ["C2SHIP", "Healthcare delivered in the home"],
  ["AHeAD", "AI-assisted healthcare decisions"],
  ["CPHAT", "Population health analytics"],
  ["MIXR", "Extended reality in medicine"],
  ["cMUSIC", "Ultrasound systems for care"],
  ["BRAIN", "Neurotechnology"],
  ["CBM", "Bioanalytic measurement"],
  ["CADMIM", "Integrated microfluidics"],
  ["AMBIC", "Mammalian biomanufacturing"],
  ["CIMSEPP", "Pharmaceutical products"],
  ["DATA", "Drug development and treatment assessment"],
  ["SCDDR", "Secure computing for drug discovery"],
];
