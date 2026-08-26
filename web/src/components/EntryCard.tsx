import type { JournalEntry } from "../lib/journal";
import { formatDate, intensityTone } from "../lib/format";
import { patternDetail, patternLabel } from "../lib/patterns";

/**
 * One check-in, written up: what it was, the thought underneath it, and one
 * line to come back to. Shared by the calendar's day view and "every
 * check-in" view on the Check-in page — the same card either way.
 */
export default function EntryCard({
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
