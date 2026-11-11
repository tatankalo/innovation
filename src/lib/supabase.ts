import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");

export const supabase = createClient(url, key, { auth: { persistSession: false } });

/** Patent abstracts live in `patents`, keyed by the family's representative publication. */
export async function patentAbstract(pub: string): Promise<string | null> {
  const key = "patentAbstract" + pub;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.data as string | null;
  const { data, error } = await supabase.from("patents").select("abstract").eq("publication_number", pub).maybeSingle();
  if (error) throw new Error(`patents: ${error.message}`);
  const abstract = (data?.abstract as string | null) ?? null;
  cache.set(key, { at: Date.now(), data: abstract });
  return abstract;
}

/** Snippets for awards that search reads live from `awards` (they are not in tech_index). */
export async function awardSnippets(ids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!ids.length) return out;
  const { data, error } = await supabase.from("awards").select("id,abstract").in("id", ids);
  if (error) throw new Error(`awards: ${error.message}`);
  for (const r of data ?? []) if (r.abstract) out.set(r.id as string, (r.abstract as string).slice(0, 420));
  return out;
}

// Data is static between loads, so cache RPC results in server memory for 10 minutes.
const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 10 * 60 * 1000;

export async function rpc<T>(fn: string, args: Record<string, unknown> = {}, opts: { cache?: boolean } = {}): Promise<T> {
  const useCache = opts.cache !== false;
  const key = fn + JSON.stringify(args);
  const hit = cache.get(key);
  if (useCache && hit && Date.now() - hit.at < TTL) return hit.data as T;
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(`${fn}: ${error.message}`);
  if (useCache) {
    if (cache.size > 500) cache.clear();
    cache.set(key, { at: Date.now(), data });
  }
  return data as T;
}
