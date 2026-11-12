import { LENSES } from "@/lib/format";
import { rpc, supabase } from "@/lib/supabase";

/** Precomputed pitch data. Built by `select vw_refresh();` (vw_people, vw_universities, vw_reports). */

export type Topic = "climate" | "agtech" | "health" | "ocean";
/** Shortlist-only topics have no funder brief. */
export type ListTopic = Topic | "opensource" | "all";
export type Segment = "ready" | "early" | "alumni" | "all";

export const TOPICS: Record<Topic, { label: string; long: string; color: string; funderLine: string; program: string; lens?: boolean; patentNote?: string }> = {
  climate: {
    label: "Climate",
    long: "Climate and clean energy",
    color: "var(--viz-climate_energy)",
    funderLine: "Clean power, storage, carbon, water and adaptation work coming out of US universities.",
    program: "Aspire Climatetech, American-Made Solar Prize",
    lens: true,
  },
  agtech: {
    label: "Ag tech",
    long: "Agriculture and food",
    color: "var(--viz-ag_food)",
    funderLine: "Crop genetics, soil, livestock, precision ag and food systems work coming out of US universities.",
    program: "Moonshots for Development, ag and food funders",
    lens: true,
  },
  health: {
    label: "Health",
    long: "Health technology",
    color: "var(--viz-health_bio)",
    funderLine: "Devices, diagnostics, therapeutics, neurotech and digital health work coming out of NSF-funded labs.",
    program: "Aspire Medtech, RADx, Blueprint MedTech, DEBUT",
    patentNote: "Patents are counted by sector (health and biotech), without sub-topics.",
  },
  ocean: {
    label: "Ocean",
    long: "Ocean and coastal technology",
    color: "var(--viz-computing_ai)",
    funderLine: "Ocean observation, marine energy and carbon, aquaculture and coastal resilience work coming out of NSF-funded labs.",
    program: "Ocean Enterprise Accelerator (NOAA)",
    patentNote: "Patents are not tagged for ocean topics yet, so this brief covers NSF awards only.",
  },
};

export const SEGMENTS: Record<Segment, { label: string; short: string; phrase: string; rule: string; use: string }> = {
  ready: {
    label: "Potential Pioneer teams",
    short: "Pioneer teams",
    phrase: "potential Pioneer team leads",
    rule: "NSF-funded PI or co-PI. Named inventor on a patent from the same university. Prototype-stage work or later. No NSF I-Corps award since 2021.",
    use: "Invite to form a Pioneer E-Team, then grow into Propel and funder-sponsored accelerators.",
  },
  early: {
    label: "Early movers",
    short: "Early movers",
    phrase: "near market, no patent yet",
    rule: "Near-market NSF work. No patent filed yet. No NSF I-Corps award since 2021.",
    use: "Invite to Pioneer with IP education before the patent is filed.",
  },
  alumni: {
    label: "Propel candidates",
    short: "Propel candidates",
    phrase: "I-Corps alumni with patents",
    rule: "Has an NSF I-Corps award since 2021 and is a named inventor on a patent from the same university.",
    use: "Already trained and holding IP. Candidates for Propel, mentors and showcase speakers.",
  },
  all: {
    label: "Everyone",
    short: "Everyone",
    phrase: "funded by NSF since 2021",
    rule: "Every NSF PI and co-PI with a university match since 2021.",
    use: "Browse the full roster.",
  },
};

export const VW_SUBS: Record<Topic, Record<string, string>> = {
  climate: LENSES.climate.subs,
  agtech: LENSES.agtech.subs,
  health: {
    medical_devices: "Medical devices",
    diagnostics: "Diagnostics",
    therapeutics_biotech: "Therapeutics and biotech",
    digital_health: "Digital health",
    neurotech: "Neurotech",
    assistive_rehab: "Assistive and rehab",
    womens_maternal: "Women's and maternal health",
  },
  ocean: {
    ocean_observation: "Ocean observation",
    marine_energy_carbon: "Marine energy and carbon",
    aquaculture_fisheries: "Aquaculture and fisheries",
    coastal_resilience: "Coastal resilience",
    marine_biotech: "Marine biotech",
  },
};

export type Totals = {
  awards: number;
  dollars: number;
  patents: number;
  people: number;
  ready: number;
  early: number;
  alumni: number;
  icorps_people: number;
  universities: number;
  msi_ready: number;
};
export type Report = {
  topic: Topic;
  totals: Totals;
  by_year: { yr: number; awards: number; dollars: number; patents: number }[];
  subs: { sub: string; awards: number; dollars: number; patents: number }[];
  programs: Record<string, number>;
  readiness: number[];
  top_unis: {
    id: number;
    name: string;
    state: string | null;
    hbcu: boolean | null;
    epscor: boolean;
    awards: number;
    dollars: number;
    patents: number;
    ready: number;
    people: number;
    icorps_awards: number;
  }[];
  states: Record<string, number>;
};

export type UniRow = {
  id: number;
  name: string;
  state: string | null;
  hbcu?: boolean | null;
  epscor?: boolean;
  research_awards?: number;
  research_dollars?: number;
  icorps_awards: number;
  iucrc_awards?: number;
  iucrc_dollars?: number;
  ready_people: number;
  ready_climate?: number;
  ready_agtech?: number;
  families: number;
};
export type Overview = {
  people: number;
  with_email: number;
  inventor_pis: number;
  ready: number;
  ready_recent: number;
  early: number;
  alumni: number;
  icorps_people: number;
  msi_ready: number;
  universities: number;
  unis_ready_no_icorps: number;
  iucrc_unis: number;
  iucrc_awards: number;
  iucrc_dollars: number;
  icorps_awards: number;
  epscor_unis: number;
  hbcu_unis: number;
  untapped: UniRow[];
  iucrc: UniRow[];
  msi: UniRow[];
  oss_people?: number;
  oss_awards?: number;
};

export type Person = {
  pid: number;
  name: string;
  email: string | null;
  is_pi: boolean;
  university_id: number;
  university: string;
  state: string | null;
  n_awards: number;
  total_dollars: number | null;
  last_award: string | null;
  has_icorps: boolean;
  has_iucrc: boolean;
  has_sbir: boolean;
  n_climate: number;
  n_agtech: number;
  max_readiness: number | null;
  n_patents: number;
  last_patent: string | null;
  any_grant: boolean;
  sector: string | null;
  climate_subs: string[] | null;
  ag_subs: string[] | null;
  health_subs: string[] | null;
  ocean_subs: string[] | null;
  hbcu: boolean | null;
  epscor: boolean;
  award_id: string | null;
  award_title: string | null;
};

const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 10 * 60 * 1000;

async function readReport<T>(topic: string): Promise<{ data: T; refreshed_at: string }> {
  const hit = cache.get(topic);
  if (hit && Date.now() - hit.at < TTL) return hit.data as { data: T; refreshed_at: string };
  const { data, error } = await supabase.from("vw_reports").select("data,refreshed_at").eq("topic", topic).single();
  if (error) throw new Error(`vw_reports: ${error.message}`);
  cache.set(topic, { at: Date.now(), data });
  return data as { data: T; refreshed_at: string };
}

export const getOverview = () => readReport<Overview>("overview");

/** Figures framed by VentureWell's Five-Year Strategy 2026-2031. Built by vw_build_strategy(). */
export type Strategy = {
  innovator_inventors: number;
  innovator_authors: number;
  catalysts: number;
  catalyst_inventors: number;
  families: number;
  inventors_no_icorps: number;
  unis: number;
  top20_fam_pct: number;
  top20_dollars_pct: number;
  sttr_partner_awards: number;
  sttr_unis: number;
  iucrc_centers: number;
  iucrc_papers: number;
};
export const getStrategy = () => readReport<Strategy>("strategy");
export const getReport = (t: Topic) => readReport<Report>(t);

export type ShortlistArgs = { topic: ListTopic; seg: Segment; st?: string | null; uni?: number | null; msi?: boolean; lim?: number; off?: number };
export function getShortlist(a: ShortlistArgs, opts: { cache?: boolean } = {}) {
  return rpc<{ total: number; rows: Person[] }>(
    "vw_shortlist",
    { topic: a.topic, seg: a.seg, st: a.st ?? null, uni: a.uni ?? null, msi: !!a.msi, lim: a.lim ?? 50, off: a.off ?? 0 },
    opts
  );
}

export function parseTopic(v?: string | null): ListTopic {
  return v === "climate" || v === "agtech" || v === "health" || v === "ocean" || v === "opensource" ? v : "all";
}
export const LIST_TOPICS: [ListTopic, string][] = [
  ["all", "All topics"],
  ["climate", "Climate"],
  ["agtech", "Ag tech"],
  ["health", "Health"],
  ["ocean", "Ocean"],
  ["opensource", "Open source"],
];
/** A university id from the `uni` query param, or null. */
export function parseUni(v?: string | null): number | null {
  const n = v && /^\d{1,9}$/.test(v) ? Number(v) : 0;
  return n > 0 ? n : null;
}
export function parseSegment(v?: string | null): Segment {
  return v === "early" || v === "alumni" || v === "all" ? v : "ready";
}

/** NSF awardee names arrive as legal entities ("... Board of Trustees", "... Research Inc"). Shorten for display. */
export function uniLabel(name: string) {
  let n = name
    .replace(/^The\s+/i, "")
    .replace(/^Regents of the\s+/i, "")
    .replace(/,\s*The$/i, "")
    .replace(/\s+Board of (Trustees|Regents)$/i, "")
    .replace(/\s+Center for Research Inc$/i, "")
    .replace(/,?\s+Inc\.?$/i, "")
    .replace(/\s+Research Foundation$/i, "")
    .replace(/\s+University Park$/i, "")
    .replace(/^Pennsylvania State Univ\b/, "Penn State")
    .replace(/^Northwestern University at Chicago$/, "Northwestern University")
    .trim();
  if (n === n.toUpperCase()) n = n.toLowerCase().replace(/(^|[\s\-])([a-z])/g, (_, a, b) => a + b.toUpperCase()).replace(/\b(Of|At|And|The)\b/g, (w) => w.toLowerCase());
  return n;
}

export function pct(a: number, b: number) {
  return b ? Math.round((a / b) * 100) : 0;
}
