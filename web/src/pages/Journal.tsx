import { useEffect, useMemo, useState } from "react";
import {
  fetchJournalEntries,
  setAffirmationSaved,
  summarizeJournal,
  type JournalEntry,
  type PatternStat,
} from "../lib/journal";
import { patternDetail, patternLabel } from "../lib/patterns";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function intensityTone(intensity: number): string {
  if (intensity <= 3) return "intensity-low";
  if (intensity <= 6) return "intensity-mid";
  return "intensity-high";
}

function timesLabel(count: number): string {
  return count === 1 ? "once" : `${count} times`;
}

/** The one pattern worth putting at the top: the mind's most practised move. */
function PatternSpotlight({ stat }: { stat: PatternStat }) {
  const detail = patternDetail(stat.slug);
  return (
    <section className="spotlight">
      <p className="spotlight-eyebrow">Comes up most often</p>
      <h2 className="spotlight-title">{patternLabel(stat.slug)}</h2>
      {detail && <p className="spotlight-description">{detail.description}</p>}
      <p className="spotlight-count">
        Showed up {timesLabel(stat.count)} in your check-ins.
      </p>
      {stat.thoughts.length > 0 && (
        <ul className="spotlight-thoughts">
          {stat.thoughts.slice(0, 3).map((thought, i) => (
            <li key={i}>“{thought}”</li>
          ))}
        </ul>
      )}
      {detail && (
        <p className="spotlight-question">
          Next time it turns up: <em>{detail.question}</em>
        </p>
      )}
    </section>
  );
}

function StatTiles({
  entryCount,
  thoughtCount,
  reframedCount,
  averageIntensity,
  intensityShift,
}: {
  entryCount: number;
  thoughtCount: number;
  reframedCount: number;
  averageIntensity: number | null;
  intensityShift: number | null;
}) {
  return (
    <section className="stat-tiles">
      <div className="stat-tile">
        <span className="stat-value">{entryCount}</span>
        <span className="stat-label">check-ins</span>
      </div>
      <div className="stat-tile">
        <span className="stat-value">{thoughtCount}</span>
        <span className="stat-label">thoughts caught</span>
      </div>
      <div className="stat-tile">
        <span className="stat-value">{reframedCount}</span>
        <span className="stat-label">reframed</span>
      </div>
      {averageIntensity !== null && (
        <div className="stat-tile">
          <span className="stat-value">{averageIntensity.toFixed(1)}</span>
          <span className="stat-label">
            average intensity
            {intensityShift !== null && Math.abs(intensityShift) >= 0.5 && (
              <span
                className={
                  intensityShift < 0 ? "stat-trend easing" : "stat-trend rising"
                }
              >
                {intensityShift < 0 ? "↓" : "↑"}{" "}
                {Math.abs(intensityShift).toFixed(1)} lately
              </span>
            )}
          </span>
        </div>
      )}
    </section>
  );
}

function KeptAffirmations({ entries }: { entries: JournalEntry[] }) {
  return (
    <section className="kept">
      <h2 className="section-title">Lines you kept</h2>
      <div className="kept-row">
        {entries.map((entry) => (
          <blockquote key={entry.id} className="kept-card">
            {entry.affirmation}
            <cite>{formatDate(entry.created_at)}</cite>
          </blockquote>
        ))}
      </div>
    </section>
  );
}

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

      {entry.reframe && (
        <div className="reframe-block">
          <p className="block-label">Another way to see it</p>
          <p className="reframe-text">{entry.reframe}</p>
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

      <p className="journal-reflection">{entry.reflection}</p>
    </article>
  );
}

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activePattern, setActivePattern] = useState<string | null>(null);

  useEffect(() => {
    fetchJournalEntries()
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const summary = useMemo(
    () => summarizeJournal(entries ?? []),
    [entries],
  );

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

  const kept = entries.filter((e) => e.affirmation_saved && e.affirmation);
  const topPattern = summary.patterns[0];
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

      <StatTiles
        entryCount={summary.entryCount}
        thoughtCount={summary.thoughtCount}
        reframedCount={summary.reframedCount}
        averageIntensity={summary.averageIntensity}
        intensityShift={summary.intensityShift}
      />

      {topPattern && topPattern.count > 1 && (
        <PatternSpotlight stat={topPattern} />
      )}

      {summary.patterns.length > 0 && (
        <section className="pattern-strip">
          <h2 className="section-title">Patterns in your thinking</h2>
          <div className="pattern-chips">
            {summary.patterns.map((stat) => (
              <button
                key={stat.slug}
                type="button"
                className={
                  activePattern === stat.slug
                    ? "pattern-chip pattern-chip-active"
                    : "pattern-chip"
                }
                aria-pressed={activePattern === stat.slug}
                title={patternDetail(stat.slug)?.description}
                onClick={() =>
                  setActivePattern(
                    activePattern === stat.slug ? null : stat.slug,
                  )
                }
              >
                {patternLabel(stat.slug)}
                <span className="pattern-chip-count">{stat.count}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {kept.length > 0 && <KeptAffirmations entries={kept} />}

      <section className="journal-timeline">
        <h2 className="section-title">
          {activePattern ? (
            <>
              {visible.length} check-in{visible.length === 1 ? "" : "s"} with{" "}
              {patternLabel(activePattern).toLowerCase()}
              <button
                type="button"
                className="link clear-filter"
                onClick={() => setActivePattern(null)}
              >
                Show all
              </button>
            </>
          ) : (
            "Every check-in"
          )}
        </h2>
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
