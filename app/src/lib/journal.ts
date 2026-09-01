import { supabase } from "./supabase";
import { patternTone, type PatternTone } from "./patterns";
import { quadrantFor, type QuadrantId } from "./emotions";

export interface JournalEntry {
  id: string;
  emotion: string;
  intensity: number;
  trigger: string;
  technique_used: string;
  reflection: string;
  automatic_thought: string | null;
  reframe: string | null;
  /** Slugs from the taxonomy in `patterns.ts`; empty when nothing fit. */
  thinking_patterns: string[] | null;
  affirmation: string | null;
  affirmation_saved: boolean;
  /**
   * What was happening when a check-in landed well, in the person's words.
   * Recorded on its own — it does not need the doubt that came before it,
   * because most conversations never surface one.
   */
  bright_moment: string | null;
  /** What the moment said about them, when the conversation produced it. */
  revealed: string | null;
  /** Lift slugs, same taxonomy as `thinking_patterns`. */
  lift_patterns: string[] | null;
  /** Activity ids from `emotions.ts`, for what a check-in was about. */
  activities: string[] | null;
  /** Who it was about, as the person names them; "Self" is a real value. */
  people: string[] | null;
  /** Where the check-in landed on the circumplex, -10..+10. */
  point_x: number | null;
  point_y: number | null;
  created_at: string;
}

/** Newest first — the journal reads as a timeline, most recent at the top. */
export async function fetchJournalEntries(): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from("emotion_journal_entries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as JournalEntry[];
}

/**
 * Keep (or un-keep) an entry's affirmation.
 *
 * The only write the client makes. A database trigger enforces that it can
 * touch nothing else on the row, so the agent's account of a conversation
 * stays exactly as it was written.
 */
export async function setAffirmationSaved(
  id: string,
  saved: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("emotion_journal_entries")
    .update({ affirmation_saved: saved })
    .eq("id", id);
  if (error) throw error;
}

/** Every pattern slug on an entry, of either kind. */
export function patternsOf(entry: JournalEntry): string[] {
  return [...(entry.thinking_patterns ?? []), ...(entry.lift_patterns ?? [])];
}

/**
 * Where a check-in landed. Falls back to intensity when an older entry has
 * no coordinates, so pre-circumplex rows still place on the grid.
 */
export function pointOf(entry: JournalEntry): { x: number; y: number } {
  if (entry.point_x !== null && entry.point_y !== null) {
    return { x: entry.point_x, y: entry.point_y };
  }
  return { x: -entry.intensity / 2, y: 0 };
}

export function toneOfEntry(entry: JournalEntry): PatternTone {
  return pointOf(entry).x >= 0 ? "warm" : "cool";
}

/** One occurrence of a pattern, as it appeared in a single check-in. */
export interface PatternInstance {
  entryId: string;
  at: string;
  /** The thought, or the moment — whichever this entry recorded. */
  said: string;
  emotion: string;
  activities: string[];
  tone: PatternTone;
}

export interface PatternStat {
  slug: string;
  tone: PatternTone;
  count: number;
  /** Newest first, matching the order entries arrive in. */
  instances: PatternInstance[];
  firstSeen: string;
  lastSeen: string;
}

/**
 * Every pattern that recurred, of both kinds, ranked by how often.
 *
 * One list on purpose: sorting a person's own mind into a good pile and a
 * bad pile is the opposite of seeing it clearly.
 */
export function summarizePatterns(entries: JournalEntry[]): PatternStat[] {
  const byPattern = new Map<string, PatternStat>();

  for (const entry of entries) {
    const tone = toneOfEntry(entry);
    for (const slug of patternsOf(entry)) {
      const said = patternTone(slug) === "warm"
        ? entry.bright_moment ?? entry.trigger
        : entry.automatic_thought ?? entry.trigger;

      const stat = byPattern.get(slug) ?? {
        slug,
        tone: patternTone(slug),
        count: 0,
        instances: [],
        firstSeen: entry.created_at,
        lastSeen: entry.created_at,
      };
      stat.count += 1;
      stat.instances.push({
        entryId: entry.id,
        at: entry.created_at,
        said,
        emotion: entry.emotion,
        activities: entry.activities ?? [],
        tone,
      });
      // Entries arrive newest-first, so the earliest seen keeps moving back.
      stat.firstSeen = entry.created_at;
      byPattern.set(slug, stat);
    }
  }

  return [...byPattern.values()].sort(
    (a, b) => b.count - a.count || b.lastSeen.localeCompare(a.lastSeen),
  );
}

export interface Split {
  label: string;
  total: number;
  cool: number;
  warm: number;
}

function splitBy(
  entries: JournalEntry[],
  keysOf: (e: JournalEntry) => string[],
): Split[] {
  const map = new Map<string, Split>();
  for (const entry of entries) {
    const tone = toneOfEntry(entry);
    for (const key of keysOf(entry)) {
      const row = map.get(key) ?? { label: key, total: 0, cool: 0, warm: 0 };
      row.total += 1;
      row[tone] += 1;
      map.set(key, row);
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

/** Time-of-day bands. Split so the balance within a slice stays visible. */
const BANDS: [string, number, number][] = [
  ["Morning", 5, 12],
  ["Afternoon", 12, 17],
  ["Evening", 17, 21],
  ["After 9pm", 21, 29],
];

export function splitByTimeOfDay(entries: JournalEntry[]): Split[] {
  const band = (iso: string) => {
    const h = new Date(iso).getHours();
    const found = BANDS.find(([, from, to]) => h >= from && h < to);
    return found ? found[0] : "After 9pm";
  };
  const rows = splitBy(entries, (e) => [band(e.created_at)]);
  const order = BANDS.map(([label]) => label);
  return rows.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
}

export function splitByActivity(entries: JournalEntry[]): Split[] {
  return splitBy(entries, (e) => e.activities ?? []);
}

export interface CheckInSummary {
  total: number;
  cool: number;
  warm: number;
  /** Counts per circumplex quadrant, keyed as in `emotions.ts`. */
  quadrants: Record<string, number>;
}

export function summarizeCheckIns(entries: JournalEntry[]): CheckInSummary {
  const quadrants: Record<string, number> = {
    highUnpleasant: 0,
    highPleasant: 0,
    lowUnpleasant: 0,
    lowPleasant: 0,
  };
  let cool = 0;
  for (const entry of entries) {
    const { x, y } = pointOf(entry);
    const key = y >= 0
      ? x >= 0 ? "highPleasant" : "highUnpleasant"
      : x >= 0 ? "lowPleasant" : "lowUnpleasant";
    quadrants[key] += 1;
    if (x < 0) cool += 1;
  }
  return { total: entries.length, cool, warm: entries.length - cool, quadrants };
}

/**
 * Which quadrant a pattern mostly shows up in, across the entries that carry
 * it. Patterns have no colour of their own — "labeling yourself" is not
 * inherently a sad thing or an anxious thing — so the spec colours each by
 * where it actually occurs for this person. Null when nothing has a point.
 */
export function dominantQuadrant(
  stat: PatternStat,
  byId: Map<string, JournalEntry>,
): QuadrantId | null {
  const counts = new Map<QuadrantId, number>();
  for (const inst of stat.instances) {
    const entry = byId.get(inst.entryId);
    if (!entry || entry.point_x == null || entry.point_y == null) continue;
    const q = quadrantFor(pointOf(entry));
    counts.set(q, (counts.get(q) ?? 0) + 1);
  }
  let best: QuadrantId | null = null;
  let max = 0;
  for (const [q, n] of counts) if (n > max) [best, max] = [q, n];
  return best;
}

export interface PersonStat {
  name: string;
  count: number;
  /** Where the entries mentioning them mostly landed; null if none has a point. */
  quadrant: QuadrantId | null;
}

/**
 * Who keeps turning up, ranked by mentions. Each carries the quadrant the
 * entries naming them mostly fell in, which is what colours their bubble —
 * a person has no colour of their own any more than a pattern does.
 */
export function summarizePeople(entries: JournalEntry[]): PersonStat[] {
  const stats = new Map<string, { count: number; quads: Map<QuadrantId, number> }>();
  for (const e of entries) {
    for (const raw of e.people ?? []) {
      const name = raw.trim();
      if (!name) continue;
      const s = stats.get(name) ?? { count: 0, quads: new Map() };
      s.count += 1;
      if (e.point_x != null && e.point_y != null) {
        const q = quadrantFor(pointOf(e));
        s.quads.set(q, (s.quads.get(q) ?? 0) + 1);
      }
      stats.set(name, s);
    }
  }
  return [...stats.entries()]
    .map(([name, s]) => {
      let quadrant: QuadrantId | null = null;
      let max = 0;
      for (const [q, n] of s.quads) if (n > max) [quadrant, max] = [q, n];
      return { name, count: s.count, quadrant };
    })
    .sort((a, b) => b.count - a.count);
}
