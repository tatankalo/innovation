import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import usAtlas from "us-atlas/states-albers-10m.json";
import { supabase } from "@/lib/supabase";

// Aggregates change only when data is reloaded. Cache for a day.
export const revalidate = 86400;

type VizData = {
  sectors: string[];
  universities: [number, string, string | null, number | null, number | null][];
  cells: [number, number, number, number, number, number][];
  national: [number, string, number, number, number, number][];
};

export async function GET() {
  const { data, error } = await supabase.rpc("viz_data");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const viz = data as VizData;

  // us-atlas "albers" files are already projected to a 975 x 610 frame.
  const topo = usAtlas as unknown as Topology<{ states: GeometryCollection; nation: GeometryCollection }>;
  const path = geoPath();
  const nation = path(feature(topo, topo.objects.nation)) ?? "";
  const borders = path(mesh(topo, topo.objects.states, (a, b) => a !== b)) ?? "";
  const project = geoAlbersUsa().scale(1300).translate([487.5, 305]);

  const round = (n: number) => Math.round(n * 10) / 10;
  const universities = viz.universities.map(([id, name, state, lat, lon]) => {
    const p = lat != null && lon != null ? project([lon, lat]) : null;
    return [id, name, state, p ? round(p[0]) : null, p ? round(p[1]) : null] as const;
  });

  return Response.json(
    { sectors: viz.sectors, universities, cells: viz.cells, national: viz.national, nation, borders },
    { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } }
  );
}
