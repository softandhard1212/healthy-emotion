import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { fetchJournalEntries, type JournalEntry } from "./journal";
import { PREVIEW_JOURNAL_ENTRIES } from "./previewJournal";

/**
 * The journal, loaded once per screen and refreshable. Every read-side tab —
 * Journal, Patterns, and the keep action on Talk — goes through this so they
 * agree on what "the entries" are at any moment.
 */
export function useJournal() {
  const { session, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (authLoading) return;
    if (!session) {
      setEntries(PREVIEW_JOURNAL_ENTRIES);
      setError(null);
      return;
    }
    try {
      setEntries(await fetchJournalEntries());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your journal.");
    }
  }, [authLoading, session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { entries, loading: entries === null && !error, error, refresh, preview: !session };
}
