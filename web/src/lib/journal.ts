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
  created_at: string;
}

export async function fetchJournalEntries(): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from("emotion_journal_entries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as JournalEntry[];
}
