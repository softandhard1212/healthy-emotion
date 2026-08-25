import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchJournalEntries,
  summarizePatterns,
  type JournalEntry,
  type PatternStat,
} from "../lib/journal";
import { patternDetail, patternLabel } from "../lib/patterns";
import { ACTIVITIES } from "../lib/emotions";

function activityLabel(id: string): string {
  return ACTIVITIES.find((a) => a.id === id)?.label ?? id;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

/**
 * Patterns — what keeps coming back.
 *
 * Its own page rather than a section on Trends, because it answers a
 * different question: Trends is the shape of the month, this is what recurs
 * inside it. Distortions and lifts share one ranked list; the colour marks
 * only where a check-in landed, and the legend says so, because a reader
 * will otherwise assume one of them is the good one.
 */
export default function Patterns() {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const openSlug = params.get("pattern");

  useEffect(() => {
    fetchJournalEntries()
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const stats = useMemo(
    () => (entries ? summarizePatterns(entries) : []),
    [entries],
  );
  const open = stats.find((s) => s.slug === openSlug);

  if (error) {
    return (
      <div className="reading-page">
        <p className="error">{error}</p>
      </div>
    );
  }

  if (entries === null) {
    return (
      <div className="reading-page">
        <p className="chat-empty">Reading your check-ins…</p>
      </div>
    );
  }

  if (!stats.length) {
    return (
      <div className="reading-page">
        <header className="page-head">
          <span className="eyebrow">Patterns</span>
          <h1>What keeps coming back</h1>
        </header>
        <p className="chat-empty">
          Nothing has repeated yet. Once a thought or a good moment turns up
          more than once, it shows here with everywhere it appeared.
        </p>
      </div>
    );
  }

  if (open) return <PatternDetail stat={open} onBack={() => setParams({})} />;

  // The list alone is names and counts — it shows THAT something recurs but
  // never what recognising it gives you. The most frequent one is worked
  // through underneath so that's visible without a tap.
  const example = stats[0];

  return (
    <div className="reading-page">
      <header className="page-head">
        <span className="eyebrow">Patterns · last 30 days</span>
        <h1>What keeps coming back</h1>
      </header>

      <section className="head-section">
        <ul className="pattern-list">
          {stats.map((stat) => (
            <li key={stat.slug}>
              <button
                type="button"
                className="pattern-row"
                onClick={() => setParams({ pattern: stat.slug })}
              >
                <span className={`tone-dot tone-${stat.tone}`} />
                <span className="pattern-row-name">{patternLabel(stat.slug)}</span>
                <span className="pattern-row-n">{stat.count}</span>
                <span className="pattern-row-chev" aria-hidden="true">
                  ›
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="tone-legend">
          <span>
            <i className="tone-dot tone-cool" /> showed up on hard days
          </span>
          <span>
            <i className="tone-dot tone-warm" /> on easier ones
          </span>
        </p>
      </section>

      <section>
        <span className="eyebrow">What that looks like</span>
        <p className="lead">
          Tapping a pattern opens everything it has done in your record. This
          is the one that came up most.
        </p>
        <ExampleCard stat={example} />
      </section>

      <p className="reading-foot">
        Taken from what you said, in the order you said it. Nothing is scored,
        and neither colour is the good one — they only mark where on the grid
        the check-ins carrying that pattern landed.
      </p>
    </div>
  );
}

function ExampleCard({ stat }: { stat: PatternStat }) {
  const detail = patternDetail(stat.slug);
  return (
    <div className="pattern-example">
      <div className="pattern-example-head">
        <span className={`tone-dot tone-${stat.tone}`} />
        <div>
          <b>{patternLabel(stat.slug)}</b>
          {detail && <span>{detail.description}</span>}
        </div>
        <span className="pattern-example-n">{stat.count}×</span>
      </div>
      <Instances stat={stat} />
      <Observation stat={stat} />
    </div>
  );
}

function Instances({ stat }: { stat: PatternStat }) {
  return (
    <div className="instance-list">
      {[...stat.instances].reverse().map((it) => (
        <div key={it.entryId} className={`instance tone-text-${it.tone}`}>
          <span className="instance-when">{shortDate(it.at)}</span>
          <div className="instance-body">
            <p className="instance-said">
              {stat.tone === "cool" ? `“${it.said}”` : it.said}
            </p>
            <span className="instance-meta">
              {[it.emotion, ...it.activities.map(activityLabel)]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * The recognition itself: what falls out of reading the occurrences side by
 * side. Stated as fact about the record, never as a verdict — a reader has
 * to be able to disagree with it.
 */
function Observation({ stat }: { stat: PatternStat }) {
  const counts = new Map<string, number>();
  for (const it of stat.instances) {
    for (const a of it.activities) counts.set(a, (counts.get(a) ?? 0) + 1);
  }
  const [topActivity, topCount] = [...counts.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0] ?? [null, 0];

  const lines: string[] = [];
  if (topActivity && topCount > 1 && topCount >= stat.count / 2) {
    lines.push(
      `${topCount} of the ${stat.count} were about ${activityLabel(topActivity).toLowerCase()}.`,
    );
  }
  const spread = new Set(stat.instances.map((i) => i.tone));
  if (spread.size > 1) {
    lines.push("It has turned up on hard days and easier ones both.");
  }
  if (!lines.length) return null;

  return <p className={`observation tone-rail-${stat.tone}`}>{lines.join(" ")}</p>;
}

function PatternDetail({
  stat,
  onBack,
}: {
  stat: PatternStat;
  onBack: () => void;
}) {
  const detail = patternDetail(stat.slug);
  const counts = new Map<string, number>();
  for (const it of stat.instances) {
    for (const a of it.activities) counts.set(a, (counts.get(a) ?? 0) + 1);
  }
  const bars = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const most = bars[0]?.[1] ?? 1;

  const span = new Date(stat.lastSeen).getTime() - new Date(stat.firstSeen).getTime();
  const days = Math.max(1, span / 86_400_000);

  return (
    <div className="reading-page">
      <button type="button" className="back-link" onClick={onBack}>
        ‹ All patterns
      </button>

      <header className="page-head">
        <div className="detail-title">
          <span className={`tone-dot tone-${stat.tone}`} />
          <h1>{patternLabel(stat.slug)}</h1>
        </div>
        {detail && <p className="lead">{detail.description}</p>}
        <p className="detail-meta">
          {stat.count} {stat.count === 1 ? "time" : "times"} ·{" "}
          {shortDate(stat.firstSeen)} to {shortDate(stat.lastSeen)}
        </p>
      </header>

      <section className="head-section">
        <span className="eyebrow">When</span>
        <div className="when-strip">
          {stat.instances.map((it) => {
            const at = new Date(it.at).getTime() - new Date(stat.firstSeen).getTime();
            const pct = Math.min(96, Math.max(4, (at / 86_400_000 / days) * 100));
            return (
              <i
                key={it.entryId}
                className={`tone-dot tone-${it.tone}`}
                style={{ left: `${pct}%` }}
                title={shortDate(it.at)}
              />
            );
          })}
        </div>
        <div className="when-ends">
          <span>{shortDate(stat.firstSeen)}</span>
          <span>{shortDate(stat.lastSeen)}</span>
        </div>
      </section>

      <section>
        <span className="eyebrow">In your words</span>
        <Instances stat={stat} />
      </section>

      {bars.length > 0 && (
        <section>
          <span className="eyebrow">What it was about</span>
          <div className="split-list">
            {bars.map(([id, n]) => (
              <div key={id} className="split-row">
                <div className="split-top">
                  <span>{activityLabel(id)}</span>
                  <span className="split-n">{n}</span>
                </div>
                <div className="split-bar">
                  <i
                    className={`tone-fill tone-${stat.tone}`}
                    style={{ width: `${(n / most) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Observation stat={stat} />

      <p className="reading-foot">
        Taken from your check-ins as written. The dates are when you logged
        them, not when they happened.
      </p>
    </div>
  );
}
