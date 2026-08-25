import { supabase } from "./supabase";

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

export interface PatternStat {
  slug: string;
  count: number;
  /** The thoughts this pattern was spotted in, newest first. */
  thoughts: string[];
  lastSeen: string;
}

export interface JournalSummary {
  entryCount: number;
  /** Entries where an automatic thought actually surfaced. */
  thoughtCount: number;
  reframedCount: number;
  keptCount: number;
  averageIntensity: number | null;
  /**
   * Change in average intensity from the older half of the history to the
   * newer half — negative means things have been landing lighter lately.
   * Null until there are enough entries for the comparison to mean anything.
   */
  intensityShift: number | null;
  /** Most frequent first; ties broken by which was seen most recently. */
  patterns: PatternStat[];
}

const MIN_ENTRIES_FOR_TREND = 4;

export function summarizeJournal(entries: JournalEntry[]): JournalSummary {
  const byPattern = new Map<string, PatternStat>();
  // `entries` arrives newest-first, so pushing in order keeps each stat's
  // thoughts newest-first too.
  for (const entry of entries) {
    for (const slug of entry.thinking_patterns ?? []) {
      const stat = byPattern.get(slug) ?? {
        slug,
        count: 0,
        thoughts: [],
        lastSeen: entry.created_at,
      };
      stat.count += 1;
      if (entry.automatic_thought) stat.thoughts.push(entry.automatic_thought);
      byPattern.set(slug, stat);
    }
  }

  const patterns = [...byPattern.values()].sort(
    (a, b) => b.count - a.count || b.lastSeen.localeCompare(a.lastSeen),
  );

  const intensities = entries.map((e) => e.intensity);
  const mean = (xs: number[]) =>
    xs.length ? xs.reduce((sum, x) => sum + x, 0) / xs.length : null;

  // Oldest-to-newest for the trend, so a negative shift reads as "easing".
  const chronological = [...intensities].reverse();
  const half = Math.floor(chronological.length / 2);
  const intensityShift =
    chronological.length >= MIN_ENTRIES_FOR_TREND
      ? mean(chronological.slice(half))! - mean(chronological.slice(0, half))!
      : null;

  return {
    entryCount: entries.length,
    thoughtCount: entries.filter((e) => e.automatic_thought).length,
    reframedCount: entries.filter((e) => e.reframe).length,
    keptCount: entries.filter((e) => e.affirmation_saved).length,
    averageIntensity: mean(intensities),
    intensityShift,
    patterns,
  };
}
