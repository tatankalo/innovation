import { supabase } from "@/lib/supabase";

/** NSF pipeline analysis. Built by `select refresh_pipeline();` (work/pipeline.sql), stored in vw_reports. */
export type PipeUni = {
  id: number;
  name: string;
  state: string;
  hbcu: boolean;
  land_grant: boolean;
  epscor: boolean;
  tribal: boolean;
  grp: string;
  region: string;
  pubs: number;
  awards: number;
  dollars: number;
  researchers: number;
  families: number;
  inventors: number;
  icorps: number;
  icorps_people: number;
  inventors_icorps: number;
  startups: number;
  startup_people: number;
};
export type PipeSector = { sector: string; label: string; awards: number; icorps: number; sbir: number; families: number };
export type PipeSectorGroup = { sector: string; grp: string; awards: number; dollars: number; icorps: number; families: number; startups: number };
export type Pipeline = {
  universities: PipeUni[];
  sectors: PipeSector[];
  sector_groups: PipeSectorGroup[];
  sbir_total: number;
  pubs_years: string;
};

let hit: { at: number; data: { data: Pipeline; refreshed_at: string } } | null = null;
export async function getPipeline() {
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.data;
  const { data, error } = await supabase.from("vw_reports").select("data,refreshed_at").eq("topic", "pipeline").single();
  if (error) throw new Error(`vw_reports: ${error.message}`);
  hit = { at: Date.now(), data: data as { data: Pipeline; refreshed_at: string } };
  return hit.data;
}

export type Totals = Pick<PipeUni, "pubs" | "awards" | "dollars" | "researchers" | "families" | "inventors" | "icorps" | "inventors_icorps" | "startups" | "startup_people"> & { n: number };

export function total(rows: PipeUni[]): Totals {
  const t: Totals = { n: 0, pubs: 0, awards: 0, dollars: 0, researchers: 0, families: 0, inventors: 0, icorps: 0, inventors_icorps: 0, startups: 0, startup_people: 0 };
  for (const r of rows) {
    t.n++;
    t.pubs += r.pubs;
    t.awards += r.awards;
    t.dollars += Number(r.dollars);
    t.researchers += r.researchers;
    t.families += r.families;
    t.inventors += r.inventors;
    t.icorps += r.icorps;
    t.inventors_icorps += r.inventors_icorps;
    t.startups += r.startups;
    t.startup_people += r.startup_people;
  }
  return t;
}

/** The four handoffs in the pipeline, each a rate so groups of different size compare fairly. */
export const STAGES = [
  { key: "patents", label: "Articles to patents", unit: "patent families per 1,000 journal articles", base: (t: Totals) => t.pubs / 50, rate: (t: Totals) => (t.pubs ? (1000 * t.families) / t.pubs : null) },
  { key: "inventors", label: "Researchers to inventors", unit: "% of NSF researchers named on a patent", base: (t: Totals) => t.researchers, rate: (t: Totals) => (t.researchers ? (100 * t.inventors) / t.researchers : null) },
  { key: "icorps", label: "Inventors to I-Corps", unit: "% of inventors with an I-Corps award", base: (t: Totals) => t.inventors, rate: (t: Totals) => (t.inventors ? (100 * t.inventors_icorps) / t.inventors : null) },
  { key: "startups", label: "I-Corps to startups", unit: "SBIR/STTR startups per 10 I-Corps teams", base: (t: Totals) => t.icorps, rate: (t: Totals) => (t.icorps ? (10 * t.startups) / t.icorps : null) },
] as const;

/** Rates built on fewer than this many people or teams are shown faded and never flagged. */
export const MIN_BASE = 30;

export const CUTS: { key: string; label: string; groups: { label: string; test: (u: PipeUni) => boolean }[] }[] = [
  {
    key: "type",
    label: "Institution type",
    groups: ["R1", "R2", "Research college", "Other"].map((g) => ({ label: g, test: (u: PipeUni) => u.grp === g })),
  },
  {
    key: "epscor",
    label: "EPSCoR",
    groups: [
      { label: "EPSCoR states", test: (u) => u.epscor },
      { label: "Other states", test: (u) => !u.epscor },
    ],
  },
  {
    key: "hbcu",
    label: "HBCU",
    groups: [
      { label: "HBCUs", test: (u) => u.hbcu },
      { label: "Other universities", test: (u) => !u.hbcu },
    ],
  },
  {
    key: "landgrant",
    label: "Land-grant",
    groups: [
      { label: "Land-grant", test: (u) => u.land_grant },
      { label: "Not land-grant", test: (u) => !u.land_grant },
    ],
  },
  {
    key: "region",
    label: "Region",
    groups: ["Northeast", "Midwest", "South", "West", "Territories"].map((g) => ({ label: g, test: (u: PipeUni) => u.region === g })),
  },
];
