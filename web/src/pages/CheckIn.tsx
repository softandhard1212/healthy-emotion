import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../lib/AuthContext";
import { THREAD_STORAGE_KEY, createThread, sendMessage } from "../lib/agent";
import { draftToMessage, type MoodLogDraft } from "../lib/emotions";
import {
  fetchJournalEntries,
  setAffirmationSaved,
  toneOfEntry,
  type JournalEntry,
} from "../lib/journal";
import { patternLabel } from "../lib/patterns";
import MoodLogFlow from "../components/moodlog/MoodLogFlow";
import EntryCard from "../components/EntryCard";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

/** Local-calendar-day key — created_at is a timestamp, this collapses it to a day. */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * Check-in — the daily ritual, and the record of it, in one place.
 *
 * Checking in is the one thing this page has to make easy, so the button is
 * the page: full-width, front and centre, nothing competing with it. Your
 * history is one tap away rather than gone — folded behind "This month" so
 * it doesn't have to share the top of the screen with the button, opening
 * into a calendar you can read a day at a time or, since a calendar is a
 * clumsy way to read fifteen entries in a row, unfold into the same plain
 * list Journal used to be.
 */
export default function CheckIn() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [flowOpen, setFlowOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [activePattern, setActivePattern] = useState<string | null>(null);

  useEffect(() => {
    fetchJournalEntries()
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, { cool: number; warm: number; entries: JournalEntry[] }>();
    for (const entry of entries ?? []) {
      const key = dayKey(new Date(entry.created_at));
      const row = map.get(key) ?? { cool: 0, warm: 0, entries: [] };
      row[toneOfEntry(entry)] += 1;
      row.entries.push(entry);
      map.set(key, row);
    }
    return map;
  }, [entries]);

  const visibleAll = activePattern
    ? (entries ?? []).filter((e) => (e.thinking_patterns ?? []).includes(activePattern))
    : entries ?? [];

  function selectDay(key: string) {
    setSelectedDay((current) => (current === key ? null : key));
  }

  function openShowAll(pattern: string | null) {
    setActivePattern(pattern);
    setShowAll(true);
    setSelectedDay(null);
  }

  async function handleToggleKeep(entry: JournalEntry) {
    const next = !entry.affirmation_saved;
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
        <motion.button
          type="button"
          className="checkin-hero"
          onClick={() => setFlowOpen(true)}
          whileTap={{ scale: 0.97 }}
        >
          <span className="checkin-hero-icon">
            <CalendarCheck size={30} strokeWidth={1.8} />
          </span>
          <span className="checkin-hero-label">Check in</span>
          <span className="checkin-hero-hint">Takes about a minute</span>
        </motion.button>
        {error && <p className="error">{error}</p>}
      </section>

      <section>
        <button
          type="button"
          className="checkin-fold"
          aria-expanded={calendarOpen}
          onClick={() => setCalendarOpen((v) => !v)}
        >
          <span className="eyebrow">This month</span>
          <ChevronDown
            size={16}
            strokeWidth={2}
            className={calendarOpen ? "checkin-fold-chev open" : "checkin-fold-chev"}
          />
        </button>

        {calendarOpen && !showAll && (
          <>
            <Calendar
              month={viewMonth}
              onMonth={(m) => {
                setViewMonth(m);
                setSelectedDay(null);
              }}
              byDay={byDay}
              selectedDay={selectedDay}
              onSelectDay={selectDay}
            />
            <p className="tone-legend">
              <span>
                <i className="tone-dot tone-cool" /> landed unpleasant
              </span>
              <span>
                <i className="tone-dot tone-warm" /> landed pleasant
              </span>
            </p>

            {selectedDay && byDay.get(selectedDay) && (
              <div className="day-panel">
                <div className="day-panel-head">
                  <span className="section-title">
                    {shortDate(byDay.get(selectedDay)!.entries[0].created_at)}
                  </span>
                  <button type="button" className="link" onClick={() => setSelectedDay(null)}>
                    Close
                  </button>
                </div>
                <div className="journal-timeline">
                  {byDay.get(selectedDay)!.entries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      onToggleKeep={handleToggleKeep}
                      onSelectPattern={(slug) => openShowAll(slug)}
                    />
                  ))}
                </div>
              </div>
            )}

            <button type="button" className="link" onClick={() => openShowAll(null)}>
              Show every check-in
            </button>
          </>
        )}

        {calendarOpen && showAll && (
          <div className="checkin-all">
            {activePattern ? (
              <h2 className="section-title">
                {visibleAll.length} check-in{visibleAll.length === 1 ? "" : "s"} with{" "}
                {patternLabel(activePattern).toLowerCase()}
                <button
                  type="button"
                  className="link clear-filter"
                  onClick={() => setActivePattern(null)}
                >
                  Show all
                </button>
              </h2>
            ) : (
              <button type="button" className="link" onClick={() => setShowAll(false)}>
                Back to calendar
              </button>
            )}

            {entries !== null && entries.length === 0 && (
              <p className="chat-empty">
                Nothing here yet. After a conversation in Chat, this is where
                the thought underneath the feeling gets written down.
              </p>
            )}

            <div className="journal-timeline">
              {visibleAll.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onToggleKeep={handleToggleKeep}
                  onSelectPattern={(slug) => openShowAll(slug)}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Calendar({
  month,
  onMonth,
  byDay,
  selectedDay,
  onSelectDay,
}: {
  month: Date;
  onMonth: (d: Date) => void;
  byDay: Map<string, { cool: number; warm: number; entries: JournalEntry[] }>;
  selectedDay: string | null;
  onSelectDay: (key: string) => void;
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
          const key = `${year}-${m}-${day}`;
          const row = byDay.get(key);
          const isToday = isCurrentMonth && today.getDate() === day;
          const isSelected = selectedDay === key;
          const classes = [
            "calendar-cell",
            isToday && "calendar-cell-today",
            isSelected && "calendar-cell-selected",
          ]
            .filter(Boolean)
            .join(" ");
          if (!row) {
            return (
              <span key={i} className={classes}>
                <span className="calendar-daynum">{day}</span>
              </span>
            );
          }
          return (
            <button
              key={i}
              type="button"
              className={classes}
              aria-pressed={isSelected}
              onClick={() => onSelectDay(key)}
            >
              <span className="calendar-daynum">{day}</span>
              <span className="calendar-dots">
                {row.cool > 0 && <i className="tone-dot tone-cool" />}
                {row.warm > 0 && <i className="tone-dot tone-warm" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
