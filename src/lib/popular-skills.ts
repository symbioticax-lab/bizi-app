// Server-only helper that returns the most-used skill tags across all active
// profiles. Used by the People filter chips. JS-side aggregation is fine for
// MVP scale (hundreds of users); at thousands+ this would benefit from a
// materialized view or a Postgres function with `unnest(skills)`.

import { createClient } from "@/lib/supabase/server";

export async function getPopularSkills(limit = 16): Promise<string[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("skills")
    .eq("is_active", true);

  const counts = new Map<string, number>();
  for (const row of (data ?? []) as { skills: string[] | null }[]) {
    const skills = row.skills ?? [];
    for (const skill of skills) {
      const key = skill.toLowerCase().trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([skill]) => skill);
}
