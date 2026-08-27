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
import { ACTIVITIES } from "../lib/emotions";

/** The wheel's centre and radius, in the 340×300 viewBox. */
const WHEEL = { cx: 170, cy: 150, r: 125 };
/** Dots stop short of the rim so an extreme reading still reads as inside. */
const REACH = 85;

/** -10..+10 on both axes; screen y is inverted so up is more energised. */
function place(x: number, y: number) {
  return {
    cx: WHEEL.cx + (x / 10) * REACH,
    cy: WHEEL.cy - (y / 10) * REACH,
  };
}

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
          One dot for each check-in, sitting where it landed.
        </p>

        {/* A wheel rather than a ruled grid: the four tints bleed into each
            other instead of meeting at an axis, so a reading near the middle
            reads as in-between rather than as scoring zero on two scales. */}
        <svg
          className="mood-wheel"
          viewBox="0 0 340 300"
          role="img"
          aria-label={`${summary.total} check-ins placed on the mood wheel: ${summary.cool} unpleasant, ${summary.warm} pleasant.`}
        >
          <defs>
            {/* Centred off-axis and wider than the wheel, so each tint is
                strongest in its own quarter and gone by the far side. */}
            <radialGradient id="wheel-high-un" cx="100" cy="80" r="180" gradientUnits="userSpaceOnUse">
              <stop offset="0%" className="wheel-stop-high-un" stopOpacity="0.4" />
              <stop offset="100%" className="wheel-stop-high-un" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="wheel-high-pl" cx="240" cy="80" r="180" gradientUnits="userSpaceOnUse">
              <stop offset="0%" className="wheel-stop-high-pl" stopOpacity="0.45" />
              <stop offset="100%" className="wheel-stop-high-pl" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="wheel-low-un" cx="100" cy="220" r="180" gradientUnits="userSpaceOnUse">
              <stop offset="0%" className="wheel-stop-low-un" stopOpacity="0.5" />
              <stop offset="100%" className="wheel-stop-low-un" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="wheel-low-pl" cx="240" cy="220" r="180" gradientUnits="userSpaceOnUse">
              <stop offset="0%" className="wheel-stop-low-pl" stopOpacity="0.4" />
              <stop offset="100%" className="wheel-stop-low-pl" stopOpacity="0" />
            </radialGradient>
            <clipPath id="wheel-clip">
              <circle cx={WHEEL.cx} cy={WHEEL.cy} r={WHEEL.r} />
            </clipPath>
          </defs>

          <g clipPath="url(#wheel-clip)">
            <circle cx={WHEEL.cx} cy={WHEEL.cy} r={WHEEL.r} className="wheel-ground" />
            <rect x="0" y="0" width="340" height="300" fill="url(#wheel-high-un)" />
            <rect x="0" y="0" width="340" height="300" fill="url(#wheel-high-pl)" />
            <rect x="0" y="0" width="340" height="300" fill="url(#wheel-low-un)" />
            <rect x="0" y="0" width="340" height="300" fill="url(#wheel-low-pl)" />
          </g>
          <circle cx={WHEEL.cx} cy={WHEEL.cy} r={WHEEL.r} className="wheel-rim" />

          {entries.map((entry) => {
            const { x, y } = pointOf(entry);
            const { cx, cy } = place(x, y);
            return (
              <circle
                key={entry.id}
                cx={cx}
                cy={cy}
                r="6.5"
                className={`wheel-dot tone-fill-${toneOfEntry(entry)}`}
              >
                <title>{`${entry.emotion} — ${new Date(entry.created_at).toLocaleDateString()}`}</title>
              </circle>
            );
          })}

          <g className="wheel-label">
            <text x="170" y="14" textAnchor="middle">
              ENERGISED
            </text>
            <text x="170" y="293" textAnchor="middle">
              SETTLED
            </text>
            <text x="34" y="153">
              UNPLEASANT
            </text>
            <text x="306" y="153" textAnchor="end">
              PLEASANT
            </text>
          </g>
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
        one — they only mark where on the wheel a check-in landed.
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
