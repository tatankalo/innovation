export const PROGRAMS: Record<string, { label: string; long: string }> = {
  patent: { label: "Patent", long: "Patent family" },
  research: { label: "Research", long: "NSF research award" },
  icorps: { label: "I-Corps", long: "NSF I-Corps award" },
  iucrc: { label: "IUCRC", long: "NSF IUCRC award" },
  sbir: { label: "SBIR", long: "NSF SBIR award" },
  sttr: { label: "STTR", long: "NSF STTR award" },
};
export const PROGRAM_ORDER = ["patent", "research", "icorps", "iucrc", "sbir", "sttr"];
export const AWARD_PROGRAMS = "research,icorps,iucrc,sbir,sttr";

export const SECTORS: Record<string, string> = {
  climate_energy: "Climate and energy",
  ag_food: "Agriculture and food",
  health_bio: "Health and biotech",
  computing_ai: "Computing and AI",
  materials_manufacturing: "Materials and manufacturing",
  robotics_hardware: "Robotics and hardware",
  education_social: "Education and social",
  other: "Other",
};
export const LENSES: Record<string, { label: string; subs: Record<string, string> }> = {
  climate: {
    label: "Climate",
    subs: {
      adaptation_monitoring: "Adaptation and monitoring",
      energy_storage: "Energy storage",
      clean_power: "Clean power",
      carbon_management: "Carbon management",
      water: "Water",
      grid_efficiency: "Grid and efficiency",
      buildings_materials: "Buildings and materials",
      transportation: "Transportation",
    },
  },
  agtech: {
    label: "Ag tech",
    subs: {
      crop_genetics: "Crop genetics",
      livestock_aqua: "Livestock and aquaculture",
      soil_water: "Soil and water",
      alt_protein_food: "Alt protein and food",
      precision_ag: "Precision ag",
      food_safety_supply: "Food safety and supply",
      ag_robotics: "Farm robotics",
    },
  },
};
export const READINESS = ["Basic science", "Applied research", "Prototype", "Near market"];
export function readinessLevel(r?: number | null) {
  if (r == null) return null;
  return Math.max(0, Math.min(3, Math.round(r)));
}

export function money(n?: number | null, compact = true) {
  if (n == null) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  }).format(n);
}

export function num(n?: number | null) {
  return n == null ? "" : new Intl.NumberFormat("en-US").format(n);
}

export function date(d?: string | null) {
  if (!d) return "";
  return new Date(d + "T00:00:00Z").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** "LUDLAM MARY J C" -> "Mary J. C. Ludlam" (best effort for display). */
export function inventorName(raw: string) {
  const parts = raw.trim().split(/\s+/);
  if (parts.length < 2) return titleCase(raw);
  const [last, ...rest] = parts;
  const given = rest.map((p) => (p.length === 1 ? p + "." : titleCase(p)));
  return [...given, titleCase(last)].join(" ");
}

export function titleCase(s: string) {
  return s
    .toLowerCase()
    .replace(/(^|[\s\-'])([a-z])/g, (_, a, b) => a + b.toUpperCase());
}

export function googlePatentUrl(pub: string) {
  return `https://patents.google.com/patent/${pub.replace(/-/g, "")}`;
}
export function nsfUrl(id: string) {
  return `https://www.nsf.gov/awardsearch/showAward?AWD_ID=${id}`;
}

/** Display "US-2021002602-A1" as "US 2021/0002602 A1"-ish: keep it simple and readable. */
export function pubLabel(pub: string) {
  return pub.replace(/-/g, " ");
}

/** Patent titles arrive in sentence or upper case. Normalize all-caps. */
const ENT: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
export function decode(t: string) {
  return t
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, n) => ENT[n]);
}

export function cleanTitle(raw?: string | null) {
  if (!raw) return "Untitled";
  const t = decode(raw).replace(/\s+/g, " ").trim();
  if (t === t.toUpperCase()) return t.charAt(0) + t.slice(1).toLowerCase();
  return t;
}

const STOP = new Set(["the", "and", "for", "with", "from", "that", "this", "into", "using", "use", "or", "of", "a", "an", "to", "in", "on", "by"]);
export function queryStems(q: string) {
  return q
    .toLowerCase()
    .replace(/["()\-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w) && w !== "not")
    .map((w) => w.slice(0, Math.max(4, Math.min(w.length, 6))));
}
