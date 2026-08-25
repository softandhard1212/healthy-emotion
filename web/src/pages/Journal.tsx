import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchJournalEntries,
  setAffirmationSaved,
  type JournalEntry,
} from "../lib/journal";
import { formatDate, intensityTone } from "../lib/format";
import { patternDetail, patternLabel } from "../lib/patterns";

function EntryCard({
  entry,
  onToggleKeep,
  onSelectPattern,
}: {
  entry: JournalEntry;
  onToggleKeep: (entry: JournalEntry) => void;
  onSelectPattern: (slug: string) => void;
}) {
  const patterns = entry.thinking_patterns ?? [];
  return (
    <article className="journal-card">
      <header className="journal-card-header">
        <span className="journal-emotion">{entry.emotion}</span>
        <span className={`journal-intensity ${intensityTone(entry.intensity)}`}>
          {entry.intensity}/10
        </span>
        <span className="journal-date">{formatDate(entry.created_at)}</span>
      </header>

      <p className="journal-trigger">{entry.trigger}</p>

      {entry.automatic_thought && (
        <div className="thought-block">
          <p className="block-label">The thought</p>
          <p className="thought-text">“{entry.automatic_thought}”</p>
          {patterns.length > 0 && (
            <div className="pattern-tags">
              {patterns.map((slug) => (
                <button
                  key={slug}
                  type="button"
                  className="pattern-tag"
                  title={patternDetail(slug)?.description}
                  onClick={() => onSelectPattern(slug)}
                >
                  {patternLabel(slug)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}


      {entry.affirmation && (
        <div className="affirmation-block">
          <p className="affirmation-text">{entry.affirmation}</p>
          <button
            type="button"
            className={
              entry.affirmation_saved ? "keep-button kept" : "keep-button"
            }
            aria-pressed={entry.affirmation_saved}
            onClick={() => onToggleKeep(entry)}
          >
            {entry.affirmation_saved ? "★ Kept" : "☆ Keep this"}
          </button>
        </div>
      )}

    </article>
  );
}

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The pattern filter lives in the URL so Trends can deep-link into a
  // filtered view ("/journal?pattern=catastrophizing").
  const [searchParams, setSearchParams] = useSearchParams();
  const activePattern = searchParams.get("pattern");

  useEffect(() => {
    fetchJournalEntries()
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  function setActivePattern(slug: string | null) {
    setSearchParams(slug ? { pattern: slug } : {}, { replace: true });
  }

  async function handleToggleKeep(entry: JournalEntry) {
    const next = !entry.affirmation_saved;
    // Optimistic: keeping a line should feel instant. On failure the row
    // snaps back rather than lying about what's stored.
    setEntries((current) =>
      (current ?? []).map((e) =>
        e.id === entry.id ? { ...e, affirmation_saved: next } : e,
      ),
    );
    try {
      await setAffirmationSaved(entry.id, next);
    } catch (err) {
      setEntries((current) =>
        (current ?? []).map((e) =>
          e.id === entry.id ? { ...e, affirmation_saved: !next } : e,
        ),
      );
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  if (error && entries === null) {
    return (
      <div className="journal-page">
        <p className="error">{error}</p>
      </div>
    );
  }

  if (entries === null) {
    return (
      <div className="journal-page">
        <p className="chat-empty">Loading your journal…</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="journal-page">
        <div className="journal-intro">
          <h1>Your journal</h1>
          <p className="chat-empty">
            Nothing here yet. After a conversation in Chat, this is where the
            thought underneath the feeling gets written down — along with the
            pattern it fits and one line to come back to.
          </p>
        </div>
      </div>
    );
  }

  const visible = activePattern
    ? entries.filter((e) => (e.thinking_patterns ?? []).includes(activePattern))
    : entries;

  return (
    <div className="journal-page">
      <div className="journal-intro">
        <h1>Your journal</h1>
        <p className="journal-sub">
          Written up after each conversation — what you felt, the thought
          underneath it, and one line to come back to.
        </p>
      </div>

      {error && <p className="error">{error}</p>}

      <section className="journal-timeline">
        {activePattern && (
          <h2 className="section-title">
            {visible.length} check-in{visible.length === 1 ? "" : "s"} with{" "}
            {patternLabel(activePattern).toLowerCase()}
            <button
              type="button"
              className="link clear-filter"
              onClick={() => setActivePattern(null)}
            >
              Show all
            </button>
          </h2>
        )}
        {visible.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            onToggleKeep={handleToggleKeep}
            onSelectPattern={setActivePattern}
          />
        ))}
      </section>
    </div>
  );
}
