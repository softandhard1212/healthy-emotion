/**
 * The app's four tabs.
 *
 * Trends is not a tab. It was one in the web app, but the design gives the
 * bottom bar four slots — Today, Talk, Patterns, Journal — and Trends belongs
 * to the Journal: both read back what was recorded, where Patterns reads what
 * recurs. So the Journal tab holds two views over the same entries, and the
 * `14 · Trends` and `14b · Trends - full calendar` screens live under it.
 *
 * Icon names are Lucide's, per the design spec's bottom nav.
 */
export type TabId = "today" | "talk" | "patterns" | "journal";

export interface Tab {
  id: TabId;
  label: string;
  /**
   * The route file this tab renders. Kept separate from `id` because Today is
   * the group's index route — the tab is still "today" everywhere it is
   * referred to, but the file has to be `index` for `/` to land on it.
   */
  route: string;
  /** Lucide icon name; outlined when inactive, filled when active. */
  icon: string;
}

/** Left to right, as the bar is laid out. */
export const TABS: Tab[] = [
  { id: "today", label: "Today", route: "index", icon: "circle" },
  { id: "talk", label: "Talk", route: "talk", icon: "message-circle" },
  { id: "patterns", label: "Patterns", route: "patterns", icon: "waves" },
  { id: "journal", label: "Journal", route: "journal", icon: "book-open" },
];

/** The two views the Journal tab switches between. */
export type JournalView = "entries" | "trends";

export const JOURNAL_VIEWS: { id: JournalView; label: string }[] = [
  { id: "entries", label: "Entries" },
  { id: "trends", label: "Trends" },
];
