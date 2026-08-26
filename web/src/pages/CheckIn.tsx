import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { THREAD_STORAGE_KEY, createThread, sendMessage } from "../lib/agent";
import { draftToMessage, type MoodLogDraft } from "../lib/emotions";
import {
  fetchJournalEntries,
  toneOfEntry,
  type JournalEntry,
} from "../lib/journal";
import MoodLogFlow from "../components/moodlog/MoodLogFlow";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

/** Local-calendar-day key — created_at is a timestamp, this collapses it to a day. */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Check-in — the daily ritual, kept apart from Talk.
 *
 * Opening the mood picker and having a conversation about it are different
 * asks: one takes a few taps, the other is a back-and-forth that shouldn't
 * be a precondition for either. Finishing a check-in still hands its
 * opening line to the agent, same as before, but now as a normal first
 * message on the Talk page rather than something this page has to host.
 * The calendar underneath is the same question over time — which days you
 * showed up, and roughly where they landed.
 */
export default function CheckIn() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [flowOpen, setFlowOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    fetchJournalEntries()
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, { cool: number; warm: number }>();
    for (const entry of entries ?? []) {
      const key = dayKey(new Date(entry.created_at));
      const row = map.get(key) ?? { cool: 0, warm: 0 };
      row[toneOfEntry(entry)] += 1;
      map.set(key, row);
    }
    return map;
  }, [entries]);

  async function handleComplete(draft: MoodLogDraft) {
    const accessToken = session?.access_token;
    if (!accessToken) return;
    setStarting(true);
    setError(null);
    try {
      let id = localStorage.getItem(THREAD_STORAGE_KEY);
      if (!id) {
        id = await createThread(accessToken);
        localStorage.setItem(THREAD_STORAGE_KEY, id);
      }
      await sendMessage(accessToken, id, draftToMessage(draft));
      navigate("/talk");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStarting(false);
    }
  }

  if (flowOpen) {
    return (
      <div className="chat-page checkin-flow">
        {error && <p className="error chat-error">{error}</p>}
        <MoodLogFlow saving={starting} onComplete={handleComplete} />
      </div>
    );
  }

  return (
    <div className="reading-page checkin-page">
      <header className="page-head">
        <span className="eyebrow">Check-in</span>
        <h1>How are you doing?</h1>
      </header>

      <section className="head-section">
        <button type="button" className="checkin-cta" onClick={() => setFlowOpen(true)}>
          Check in
        </button>
        {error && <p className="error">{error}</p>}
      </section>

      <section>
        <span className="eyebrow">This month</span>
        <Calendar month={viewMonth} onMonth={setViewMonth} byDay={byDay} />
        <p className="tone-legend">
          <span>
            <i className="tone-dot tone-cool" /> landed unpleasant
          </span>
          <span>
            <i className="tone-dot tone-warm" /> landed pleasant
          </span>
        </p>
      </section>
    </div>
  );
}

function Calendar({
  month,
  onMonth,
  byDay,
}: {
  month: Date;
  onMonth: (d: Date) => void;
  byDay: Map<string, { cool: number; warm: number }>;
}) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstWeekday = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === m;

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="calendar">
      <div className="calendar-head">
        <button
          type="button"
          className="calendar-nav"
          onClick={() => onMonth(new Date(year, m - 1, 1))}
          aria-label="Previous month"
        >
          ‹
        </button>
        <span>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
        <button
          type="button"
          className="calendar-nav"
          onClick={() => onMonth(new Date(year, m + 1, 1))}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="calendar-grid calendar-weekdays">
        {WEEKDAYS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((day, i) => {
          if (day === null) {
            return <span key={i} className="calendar-cell calendar-cell-empty" />;
          }
          const row = byDay.get(`${year}-${m}-${day}`);
          const isToday = isCurrentMonth && today.getDate() === day;
          return (
            <span key={i} className={`calendar-cell${isToday ? " calendar-cell-today" : ""}`}>
              <span className="calendar-daynum">{day}</span>
              {row && (
                <span className="calendar-dots">
                  {row.cool > 0 && <i className="tone-dot tone-cool" />}
                  {row.warm > 0 && <i className="tone-dot tone-warm" />}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
