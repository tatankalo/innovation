import { geoAlbersUsa } from "d3-geo";
import { feature, merge, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import usAtlas from "us-atlas/states-albers-10m.json";
import shelfJson from "@/data/landing-shelf.json";
import mapJson from "@/data/landing-map.json";
import { uniLabel } from "@/lib/vw";

/**
 * Static data for the two landing visuals. Both JSON files are written by
 * work/landing/build_landing_data.py. Server only: the page passes plain props on.
 */

// ---------------------------------------------------------------- The Shelf

export type Spine = {
  /** Patent family id, the link target. */
  f: string;
  pid: number;
  /** Patent title, cleaned for display. */
  t: string;
  /** Inventor. */
  n: string;
  /** University, shortened for display. */
  u: string;
  /** Patent families. */
  p: number;
  /** NSF dollars. */
  d: number;
  /** Has an I-Corps award. */
  ic: boolean;
  /** I-Corps awards. */
  nic: number;
};

export function getShelf() {
  const { totals, perRow, visible, open } = shelfJson;
  const spines: Spine[] = shelfJson.spines.map((s) => ({ f: s.f, pid: s.pid, t: s.t, n: s.n, u: uniLabel(s.u), p: s.p, d: s.d, ic: s.ic === 1, nic: s.nic }));
  const rows = [spines.slice(0, perRow), spines.slice(perRow)];
  /** Spines shown and how many are orange, per screen size. */
  const shown = (per: number) => {
    const s = rows.flatMap((r) => r.slice(0, per));
    return { total: s.length, icorps: s.filter((x) => x.ic).length, never: s.filter((x) => !x.ic).length };
  };
  return {
    totals,
    rows,
    open,
    perRow,
    visible,
    counts: { phone: shown(visible.phone), tablet: shown(visible.tablet), desktop: shown(visible.desktop) },
  };
}

// ---------------------------------------------------------------- The Pioneer map

/** us-atlas "albers" files are already projected to this frame. */
export const MAP_W = 975;
export const MAP_H = 610;
/** Extra room above the frame so the tallest northern spikes are not clipped. */
export const MAP_TOP = 44;
const SPIKE_BASE = 4;
const SPIKE_PER_LEAD = 5;
export const spikeHeight = (n: number) => SPIKE_BASE + n * SPIKE_PER_LEAD;

const FIPS: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY",
};

/** Map labels use the name people say, not the legal awardee name. */
const SHORT: Record<number, string> = {
  1: "Purdue", 23: "Arizona State", 5: "Michigan", 34: "UC San Diego", 21: "Carnegie Mellon", 69: "Northeastern",
  11: "Wisconsin", 16: "NC State", 20: "Illinois", 4: "MIT", 13: "Washington", 133: "Northwestern", 49: "Iowa State",
  15: "Minnesota", 22: "UCLA", 98: "Utah", 6: "Maryland", 48: "USC", 110: "Penn", 35: "Rutgers", 37: "Colorado",
  51: "Columbia", 52: "South Florida", 2: "UT Austin", 162: "Kansas", 99: "Oklahoma", 115: "South Carolina",
  56: "Alabama", 43: "Florida", 19: "Arizona", 32: "Ohio State",
};

export type Spike = { id: number; name: string; state: string; n: number; teal: boolean; x: number; y: number };
export type SpikeLabel = { id: number; text: string; n: number; teal: boolean; x: number; y: number };

type Ring = number[][];

/** Whole-pixel, relative path commands. Keeps the inline basemap small. */
function ringPath(ring: Ring, close: boolean) {
  let px = Math.round(ring[0][0]);
  let py = Math.round(ring[0][1]);
  const d = `M${px},${py}`;
  let n = 1;
  let seg = "";
  for (let i = 1; i < ring.length; i++) {
    const x = Math.round(ring[i][0]);
    const y = Math.round(ring[i][1]);
    if (x === px && y === py) continue;
    seg += `${seg ? " " : "l"}${x - px},${y - py}`;
    px = x;
    py = y;
    n++;
  }
  if (close && n < 4) return ""; // a speck smaller than a pixel
  return d + seg + (close ? "z" : "");
}
const polysPath = (polys: Ring[][]) => polys.map((p) => p.map((r) => ringPath(r, true)).join("")).join("");

function place(spikes: Spike[], fontSize: number, max: number) {
  const out: SpikeLabel[] = [];
  const boxes: [number, number, number, number][] = [];
  for (const s of spikes) {
    if (out.length >= max) break;
    const short = SHORT[s.id];
    if (!short) continue;
    const text = short;
    const w = (text.length + 1 + String(s.n).length) * fontSize * 0.58;
    const x = Math.min(MAP_W - w / 2 - 4, Math.max(w / 2 + 4, s.x));
    const y = s.y - spikeHeight(s.n) - fontSize * 0.5;
    const box: [number, number, number, number] = [x - w / 2 - 4, y - fontSize, x + w / 2 + 4, y + 3];
    if (box[1] < -MAP_TOP) continue;
    if (boxes.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
    boxes.push(box);
    out.push({ id: s.id, text, n: s.n, teal: s.teal, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  }
  return out;
}

let cached: ReturnType<typeof buildPioneerMap> | null = null;
export const getPioneerMap = () => (cached ??= buildPioneerMap());

function buildPioneerMap() {
  const topo = usAtlas as unknown as Topology<{ states: GeometryCollection; nation: GeometryCollection }>;
  const epscor = new Set(mapJson.epscor);
  const nation = feature(topo, topo.objects.nation);
  const land = nation.features.map((f) => (f.geometry.type === "MultiPolygon" ? polysPath(f.geometry.coordinates) : f.geometry.type === "Polygon" ? polysPath([f.geometry.coordinates]) : "")).join("");
  const shaded = polysPath(
    merge(
      topo,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (topo.objects.states.geometries as any[]).filter((g) => epscor.has(FIPS[String(g.id)]))
    ).coordinates
  );
  const borders = mesh(topo, topo.objects.states, (a, b) => a !== b).coordinates.map((l) => ringPath(l, false)).join("");

  const project = geoAlbersUsa().scale(1300).translate([MAP_W / 2, MAP_H / 2]);
  const spikes: Spike[] = [];
  for (const u of mapJson.unis as [number, string, string, number, number, number, number][]) {
    const [id, name, state, lon, lat, n, teal] = u;
    const p = project([lon, lat]);
    if (!p) throw new Error(`landing-map: ${name} does not project onto the US map`);
    spikes.push({ id, name: uniLabel(name), state, n, teal: teal === 1, x: Math.round(p[0] * 10) / 10, y: Math.round(p[1] * 10) / 10 });
  }
  const byCount = [...spikes].sort((a, b) => b.n - a.n || a.id - b.id);
  // Label the tallest spikes, and make sure the tallest teal ones get a name too.
  const tealFirst = byCount.filter((s) => s.teal).slice(0, 4);
  const wide = place([...byCount.slice(0, 12), ...tealFirst.filter((s) => !byCount.slice(0, 12).includes(s)), ...byCount.slice(12, 24)], 15, 16);
  const narrow = place([...byCount.slice(0, 3), tealFirst[0], ...byCount.slice(3, 8)], 30, 4);
  // Draw north to south so nearer spikes overlap farther ones, teal on top.
  spikes.sort((a, b) => Number(a.teal) - Number(b.teal) || a.y - b.y);
  return { totals: mapJson.totals, land, shaded, borders, spikes, labels: { wide, narrow } };
}
