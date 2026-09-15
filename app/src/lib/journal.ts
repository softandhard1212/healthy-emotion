import { supabase } from "./supabase";
import { activityLabel, describePoint } from "./emotions";
import { listWords } from "./format";
import { CONTEXT_PREFIX } from "./agent";

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

/** One entry by id, or null if it doesn't exist (or isn't this user's). */
export async function fetchEntry(id: string): Promise<JournalEntry | null> {
  const { data, error } = await supabase
    .from("emotion_journal_entries")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as JournalEntry | null;
}

/**
 * The message that opens a "Talk it through" conversation about an entry
 * already logged through the word-picker. Carries the entry's id behind
 * `CONTEXT_PREFIX` so the client hides it from the chat while the agent
 * still reads it — see instructions.md's "Opening from a check-in".
 */
export function entryToMessage(entry: JournalEntry): string {
  const parts: string[] = [];
  const feeling = entry.emotion.trim() || describePoint(pointOf(entry));
  parts.push(`I logged a check-in: feeling ${feeling}.`);
  const labels = (entry.activities ?? []).map(activityLabel);
  if (labels.length) parts.push(`It's tied up with ${listWords(labels)}.`);
  if (entry.trigger.trim()) parts.push(entry.trigger.trim());
  parts.push("Can we talk it through?");
  return `${CONTEXT_PREFIX}entry_id=${entry.id}\n${parts.join(" ")}`;
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
