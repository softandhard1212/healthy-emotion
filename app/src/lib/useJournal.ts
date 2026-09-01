import { useCallback, useEffect, useState } from "react";
import { fetchJournalEntries, type JournalEntry } from "./journal";

/**
 * The journal, loaded once per screen and refreshable. Every read-side tab —
 * Journal, Patterns, and the keep action on Talk — goes through this so they
 * agree on what "the entries" are at any moment.
 */
export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setEntries(await fetchJournalEntries());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your journal.");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { entries, loading: entries === null && !error, error, refresh };
}
