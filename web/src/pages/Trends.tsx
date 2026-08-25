import { useEffect, useMemo, useState } from "react";
import {
  fetchJournalEntries,
  pointOf,
  splitByActivity,
  splitByTimeOfDay,
  summarizeCheckIns,
  toneOfEntry,
  type JournalEntry,
  type Split,
} from "../lib/journal";
import { ACTIVITIES, QUADRANTS, type QuadrantId } from "../lib/emotions";

const PLOT = { left: 30, top: 15, w: 280, h: 210 };

/** -10..+10 on both axes; screen y is inverted so up is high energy. */
function place(x: number, y: number) {
  return {
    cx: PLOT.left + ((x + 10) / 20) * PLOT.w,
    cy: PLOT.top + ((10 - y) / 20) * PLOT.h,
  };
}

const CORNERS: { id: QuadrantId; x: number; y: number; anchor: "start" | "end" }[] = [
  { id: "highUnpleasant", x: 40, y: 38, anchor: "start" },
  { id: "highPleasant", x: 300, y: 38, anchor: "end" },
  { id: "lowUnpleasant", x: 40, y: 218, anchor: "start" },
  { id: "lowPleasant", x: 300, y: 218, anchor: "end" },
];

function activityLabel(id: string): string {
  return ACTIVITIES.find((a) => a.id === id)?.label ?? id;
}

/**
 * Trends — the shape of the month.
 *
 * The raw record, not the interpretation: what recurs lives on Patterns.
 * The scatter reuses the check-in's own grid so a dot's position is the
 * person's own answer rather than a score, and every bar splits by where a
 * check-in landed so the balance inside a slice stays visible.
 */
export default function Trends() {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJournalEntries()
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const summary = useMemo(
    () => (entries ? summarizeCheckIns(entries) : null),
    [entries],
  );
  const byTime = useMemo(
    () => (entries ? splitByTimeOfDay(entries) : []),
    [entries],
  );
  const byActivity = useMemo(
    () => (entries ? splitByActivity(entries) : []),
    [entries],
  );

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

  if (!entries.length || !summary) {
    return (
      <div className="reading-page">
        <header className="page-head">
          <span className="eyebrow">Trends</span>
          <h1>The shape of the month</h1>
        </header>
        <p className="chat-empty">
          Nothing to chart yet. Once you've had a few conversations, this is
          where the shape of them shows up.
        </p>
      </div>
    );
  }

  return (
    <div className="reading-page">
      <header className="page-head">
        <span className="eyebrow">Trends · last 30 days</span>
        <h1>The shape of the month</h1>
      </header>

      <section className="head-section">
        <p className="lead">
          One dot for each check-in, sitting where that check-in landed. The
          number in each corner is how many went there.
        </p>

        <svg
          className="grid-plot"
          viewBox="0 0 340 266"
          role="img"
          aria-label={`${summary.total} check-ins plotted on the mood grid: ${summary.cool} unpleasant, ${summary.warm} pleasant.`}
        >
          <rect x="30" y="15" width="140" height="105" className="q-high-un" />
          <rect x="170" y="15" width="140" height="105" className="q-high-pl" />
          <rect x="30" y="120" width="140" height="105" className="q-low-un" />
          <rect x="170" y="120" width="140" height="105" className="q-low-pl" />

          <line x1="170" y1="15" x2="170" y2="225" className="grid-axis" />
          <line x1="30" y1="120" x2="310" y2="120" className="grid-axis" />

          {CORNERS.map((c) => (
            <text
              key={c.id}
              x={c.x}
              y={c.y}
              textAnchor={c.anchor}
              className={`grid-count grid-count-${QUADRANTS[c.id].tone}`}
            >
              {summary.quadrants[c.id]}
            </text>
          ))}

          {entries.map((entry) => {
            const { x, y } = pointOf(entry);
            const { cx, cy } = place(x, y);
            return (
              <circle
                key={entry.id}
                cx={cx}
                cy={cy}
                r="6.5"
                className={`grid-dot tone-fill-${toneOfEntry(entry)}`}
              >
                <title>{`${entry.emotion} — ${new Date(entry.created_at).toLocaleDateString()}`}</title>
              </circle>
            );
          })}

          <text x="30" y="10" className="grid-label">
            HIGH ENERGY
          </text>
          <text x="30" y="243" className="grid-label">
            LOW ENERGY
          </text>
          <text x="30" y="261" className="grid-label">
            ← UNPLEASANT
          </text>
          <text x="310" y="261" textAnchor="end" className="grid-label">
            PLEASANT →
          </text>
        </svg>

        <p className="observation">
          {summary.total} check-ins — {summary.cool} landed unpleasant,{" "}
          {summary.warm} pleasant.
        </p>
      </section>

      {byTime.length > 0 && (
        <section>
          <span className="eyebrow">When</span>
          <SplitList rows={byTime} />
        </section>
      )}

      {byActivity.length > 0 && (
        <section>
          <span className="eyebrow">What they were about</span>
          <SplitList rows={byActivity} labelOf={activityLabel} />
        </section>
      )}

      <p className="reading-foot">
        Every check-in you logged, as you logged it. Neither colour is the good
        one — they only mark where on the grid a check-in landed.
      </p>
    </div>
  );
}

function SplitList({
  rows,
  labelOf = (s: string) => s,
}: {
  rows: Split[];
  labelOf?: (s: string) => string;
}) {
  const most = Math.max(...rows.map((r) => r.total));
  return (
    <div className="split-list">
      {rows.map((row) => (
        <div key={row.label} className="split-row">
          <div className="split-top">
            <span>{labelOf(row.label)}</span>
            <span className="split-n">{row.total}</span>
          </div>
          {/* The bar's width is the count; the segments inside are the
              balance, so a slice that is all one tone reads at a glance. */}
          <div
            className="split-bar split-bar-split"
            style={{ width: `${(row.total / most) * 100}%` }}
          >
            {row.cool > 0 && (
              <i className="tone-fill tone-cool" style={{ flex: row.cool }} />
            )}
            {row.warm > 0 && (
              <i className="tone-fill tone-warm" style={{ flex: row.warm }} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
