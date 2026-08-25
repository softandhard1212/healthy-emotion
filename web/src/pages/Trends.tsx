import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchJournalEntries,
  summarizeJournal,
  type JournalEntry,
  type PatternStat,
} from "../lib/journal";
import { formatDate } from "../lib/format";
import { patternDetail, patternLabel } from "../lib/patterns";

function timesLabel(count: number): string {
  return count === 1 ? "once" : `${count} times`;
}

/**
 * Intensity over time — one series, so no legend: the heading names it.
 * Sized in viewBox units and scaled by the container, so it stays legible
 * from phone to desktop without measuring the DOM.
 */
function IntensityChart({ entries }: { entries: JournalEntry[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  // Oldest to newest, left to right.
  const points = useMemo(() => [...entries].reverse(), [entries]);
  if (points.length < 2) return null;

  const W = 600;
  const H = 190;
  const padX = 34;
  const padTop = 14;
  const padBottom = 30;
  const plotW = W - padX - 12;
  const plotH = H - padTop - padBottom;

  const x = (i: number) => padX + (i / (points.length - 1)) * plotW;
  const y = (v: number) => padTop + (1 - v / 10) * plotH;

  const line = points.map((p, i) => `${x(i)},${y(p.intensity)}`).join(" ");
  const area = `${padX},${y(0)} ${line} ${x(points.length - 1)},${y(0)}`;
  const active = hovered === null ? null : points[hovered];

  return (
    <figure className="chart-figure">
      <figcaption className="section-title">How intense it's felt</figcaption>
      <svg
        className="chart"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Intensity of each check-in over time, from ${formatDate(
          points[0].created_at,
        )} to ${formatDate(points[points.length - 1].created_at)}, on a scale of 0 to 10.`}
        onPointerLeave={() => setHovered(null)}
      >
        {/* Recessive grid — reference, not content. */}
        {[0, 5, 10].map((v) => (
          <g key={v}>
            <line
              className="chart-grid"
              x1={padX}
              x2={W - 12}
              y1={y(v)}
              y2={y(v)}
            />
            <text className="chart-axis" x={padX - 8} y={y(v) + 4} textAnchor="end">
              {v}
            </text>
          </g>
        ))}

        <polyline className="chart-area" points={area} />
        <polyline className="chart-line" points={line} />

        {points.map((p, i) => (
          <circle
            key={p.id}
            className={hovered === i ? "chart-dot chart-dot-active" : "chart-dot"}
            cx={x(i)}
            cy={y(p.intensity)}
            r={hovered === i ? 6 : 4.5}
          />
        ))}

        {/* Hit targets wider than the marks. */}
        {points.map((p, i) => (
          <rect
            key={`hit-${p.id}`}
            x={x(i) - plotW / (points.length - 1) / 2}
            y={padTop}
            width={plotW / (points.length - 1)}
            height={plotH}
            fill="transparent"
            onPointerEnter={() => setHovered(i)}
          />
        ))}

        <text className="chart-axis" x={padX} y={H - 8}>
          {formatDate(points[0].created_at).split(",")[0]}
        </text>
        <text className="chart-axis" x={W - 12} y={H - 8} textAnchor="end">
          {formatDate(points[points.length - 1].created_at).split(",")[0]}
        </text>

        {active && hovered !== null && (
          <g
            transform={`translate(${Math.min(
              Math.max(x(hovered) - 70, 4),
              W - 144,
            )}, ${Math.max(y(active.intensity) - 52, 4)})`}
            pointerEvents="none"
          >
            <rect className="chart-tooltip" width="140" height="42" rx="8" />
            <text className="chart-tooltip-title" x="10" y="18">
              {active.emotion} · {active.intensity}/10
            </text>
            <text className="chart-tooltip-meta" x="10" y="33">
              {formatDate(active.created_at)}
            </text>
          </g>
        )}
      </svg>
    </figure>
  );
}

/** The one pattern worth putting at the top: the mind's most practised move. */
function PatternSpotlight({
  stat,
  onOpen,
}: {
  stat: PatternStat;
  onOpen: () => void;
}) {
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
      <button type="button" className="link spotlight-link" onClick={onOpen}>
        Read these check-ins →
      </button>
    </section>
  );
}

export default function Trends() {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJournalEntries()
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const summary = useMemo(() => summarizeJournal(entries ?? []), [entries]);

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
        <p className="chat-empty">Loading your trends…</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="journal-page">
        <div className="journal-intro">
          <h1>Trends</h1>
          <p className="chat-empty">
            Nothing to chart yet. Once you've had a few conversations, this is
            where the patterns across them show up.
          </p>
        </div>
      </div>
    );
  }

  const kept = entries.filter((e) => e.affirmation_saved && e.affirmation);
  const topPattern = summary.patterns[0];
  const openPattern = (slug: string) =>
    navigate(`/journal?pattern=${encodeURIComponent(slug)}`);

  return (
    <div className="journal-page">
      <div className="journal-intro">
        <h1>Trends</h1>
        <p className="journal-sub">
          What's been showing up across your check-ins — the feelings, and the
          thoughts underneath them.
        </p>
      </div>

      <section className="stat-tiles">
        <div className="stat-tile">
          <span className="stat-value">{summary.entryCount}</span>
          <span className="stat-label">check-ins</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{summary.thoughtCount}</span>
          <span className="stat-label">thoughts caught</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{summary.reframedCount}</span>
          <span className="stat-label">reframed</span>
        </div>
        {summary.averageIntensity !== null && (
          <div className="stat-tile">
            <span className="stat-value">
              {summary.averageIntensity.toFixed(1)}
            </span>
            <span className="stat-label">
              average intensity
              {summary.intensityShift !== null &&
                Math.abs(summary.intensityShift) >= 0.5 && (
                  <span
                    className={
                      summary.intensityShift < 0
                        ? "stat-trend easing"
                        : "stat-trend rising"
                    }
                  >
                    {summary.intensityShift < 0 ? "↓" : "↑"}{" "}
                    {Math.abs(summary.intensityShift).toFixed(1)} lately
                  </span>
                )}
            </span>
          </div>
        )}
      </section>

      <IntensityChart entries={entries} />

      {topPattern && topPattern.count > 1 && (
        <PatternSpotlight
          stat={topPattern}
          onOpen={() => openPattern(topPattern.slug)}
        />
      )}

      {summary.patterns.length > 0 && (
        <section className="pattern-strip">
          <h2 className="section-title">Patterns in your thinking</h2>
          <div className="pattern-chips">
            {summary.patterns.map((stat) => (
              <button
                key={stat.slug}
                type="button"
                className="pattern-chip"
                title={patternDetail(stat.slug)?.description}
                onClick={() => openPattern(stat.slug)}
              >
                {patternLabel(stat.slug)}
                <span className="pattern-chip-count">{stat.count}</span>
              </button>
            ))}
          </div>
          <p className="pattern-hint">
            Tap one to read the check-ins it showed up in.
          </p>
        </section>
      )}

      {kept.length > 0 && (
        <section className="kept">
          <h2 className="section-title">Lines you kept</h2>
          <div className="kept-row">
            {kept.map((entry) => (
              <blockquote key={entry.id} className="kept-card">
                {entry.affirmation}
                <cite>{formatDate(entry.created_at)}</cite>
              </blockquote>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
