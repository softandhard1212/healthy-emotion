import { useEffect, useState } from "react";
import { fetchJournalEntries, type JournalEntry } from "../lib/journal";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function intensityColor(intensity: number): string {
  if (intensity <= 3) return "intensity-low";
  if (intensity <= 6) return "intensity-mid";
  return "intensity-high";
}

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJournalEntries()
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  if (error) {
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
        <p className="chat-empty">
          Nothing here yet — entries show up automatically as you talk things
          through in Chat.
        </p>
      </div>
    );
  }

  return (
    <div className="journal-page">
      {entries.map((entry) => (
        <div key={entry.id} className="journal-card">
          <div className="journal-card-header">
            <span className="journal-emotion">{entry.emotion}</span>
            <span className={`journal-intensity ${intensityColor(entry.intensity)}`}>
              {entry.intensity}/10
            </span>
            <span className="journal-date">{formatDate(entry.created_at)}</span>
          </div>
          <p className="journal-trigger">{entry.trigger}</p>
          {entry.automatic_thought && (
            <p className="journal-thought">
              <span className="journal-label">Thought:</span>{" "}
              {entry.automatic_thought}
            </p>
          )}
          {entry.reframe && (
            <p className="journal-reframe">
              <span className="journal-label">Reframe:</span> {entry.reframe}
            </p>
          )}
          <p className="journal-reflection">{entry.reflection}</p>
        </div>
      ))}
    </div>
  );
}
