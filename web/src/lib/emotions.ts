/**
 * The emotion vocabulary behind the three-step check-in.
 *
 * Step 1 puts a point on Russell's circumplex — energy on Y, pleasantness on
 * X — which is far easier than recalling a word for a feeling. The quadrant
 * that point lands in then decides where Step 2 opens, so the person starts
 * among the words most likely to fit instead of scanning all of them.
 *
 * Quadrant slugs follow the circumplex, not the screen: `highPleasant` is the
 * top-right of the grid as drawn, but the name survives a layout change.
 */

export type QuadrantId =
  | "highPleasant"
  | "lowPleasant"
  | "highUnpleasant"
  | "lowUnpleasant";

export interface Quadrant {
  id: QuadrantId;
  /** Shown as the quadrant's heading in the matrix. */
  title: string;
  /** One line naming the felt state, for people who don't recognise the words. */
  hint: string;
  emotions: string[];
  /** Pastel fill and its readable ink, tuned to sit on the app's warm ground. */
  tint: string;
  tintActive: string;
  ink: string;
  border: string;
}

export const QUADRANTS: Record<QuadrantId, Quadrant> = {
  highPleasant: {
    id: "highPleasant",
    title: "Lit up",
    hint: "Pleasant, and there's energy behind it.",
    emotions: [
      "Joyful", "Excited", "Proud", "Energised",
      "Playful", "Hopeful", "Inspired", "Confident",
      "Amused", "Affectionate",
    ],
    tint: "#fdf0d8",
    tintActive: "#f8dfae",
    ink: "#8a5a12",
    border: "#e8c98a",
  },
  lowPleasant: {
    id: "lowPleasant",
    title: "Settled",
    hint: "Pleasant, and quiet with it.",
    emotions: [
      "Calm", "Content", "Grateful", "Peaceful",
      "Relieved", "Rested", "Safe", "Tender",
      "Satisfied", "Reflective",
    ],
    tint: "#dff0e8",
    tintActive: "#bfe0d1",
    ink: "#1f6350",
    border: "#93c9b3",
  },
  highUnpleasant: {
    id: "highUnpleasant",
    title: "Wound up",
    hint: "Unpleasant, and it's keyed up.",
    emotions: [
      "Anxious", "Angry", "Frustrated", "Overwhelmed",
      "Stressed", "Scared", "Restless", "Irritated",
      "Embarrassed", "Jealous",
    ],
    tint: "#fbe3de",
    tintActive: "#f5c7bd",
    ink: "#963d2a",
    border: "#e2a08f",
  },
  lowUnpleasant: {
    id: "lowUnpleasant",
    title: "Weighed down",
    hint: "Unpleasant, and it's heavy or flat.",
    emotions: [
      "Sad", "Lonely", "Bored", "Exhausted",
      "Numb", "Discouraged", "Guilty", "Hopeless",
      "Withdrawn", "Disappointed",
    ],
    tint: "#e3e5f5",
    tintActive: "#c8ccec",
    ink: "#3f4288",
    border: "#a7abdd",
  },
};

/**
 * Reading order of the matrix, which mirrors the grid in Step 1 — top-left,
 * top-right, bottom-left, bottom-right — so the two screens agree spatially.
 */
export const QUADRANT_ORDER: QuadrantId[] = [
  "highUnpleasant",
  "highPleasant",
  "lowUnpleasant",
  "lowPleasant",
];

/** Both axes run -10..+10; x is pleasantness, y is energy (positive = high). */
export interface MoodPoint {
  x: number;
  y: number;
}

export function quadrantFor({ x, y }: MoodPoint): QuadrantId {
  if (y >= 0) return x >= 0 ? "highPleasant" : "highUnpleasant";
  return x >= 0 ? "lowPleasant" : "lowUnpleasant";
}

/**
 * Plain words for a point, used in the summary and in what gets sent to the
 * coach — "fairly pleasant, high energy" reads better than "x: 6, y: 4".
 */
export function describePoint({ x, y }: MoodPoint): string {
  const strength = (v: number) => {
    const n = Math.abs(v);
    if (n <= 2) return "slightly";
    if (n <= 6) return "fairly";
    return "very";
  };
  const mood = `${strength(x)} ${x >= 0 ? "pleasant" : "unpleasant"}`;
  const energy = `${strength(y)} ${y >= 0 ? "high" : "low"} energy`;
  return `${mood}, ${energy}`;
}

export interface Activity {
  id: string;
  label: string;
  /** Lucide icon name, resolved by the step that renders it. */
  icon: string;
}

export const ACTIVITIES: Activity[] = [
  { id: "work", label: "Work", icon: "Laptop" },
  { id: "social", label: "Social", icon: "Users" },
  { id: "sleep", label: "Sleep", icon: "Bed" },
  { id: "health", label: "Health", icon: "Heart" },
  { id: "family", label: "Family", icon: "Home" },
  { id: "money", label: "Money", icon: "Wallet" },
  { id: "study", label: "Study", icon: "BookOpen" },
  { id: "exercise", label: "Exercise", icon: "Activity" },
  { id: "food", label: "Food", icon: "Utensils" },
  { id: "alone", label: "Alone time", icon: "Moon" },
  { id: "outdoors", label: "Outdoors", icon: "Trees" },
  { id: "news", label: "News", icon: "Newspaper" },
];

export interface MoodLogDraft {
  point: MoodPoint;
  quadrant: QuadrantId;
  emotions: string[];
  activities: string[];
  note: string;
}

/**
 * The opening message the coach receives. It reads as something a person
 * would say, not a form dump, because the agent's first job is to reflect it
 * back — and "x: -6" gives it nothing to work with.
 */
export function draftToMessage(draft: MoodLogDraft): string {
  const parts: string[] = [];
  parts.push(
    draft.emotions.length
      ? `Feeling ${listWords(draft.emotions.map((e) => e.toLowerCase()))}.`
      : `Feeling ${describePoint(draft.point)}.`,
  );
  if (draft.emotions.length) {
    parts.push(`On the scales, that's ${describePoint(draft.point)}.`);
  }
  if (draft.activities.length) {
    const labels = draft.activities
      .map((id) => ACTIVITIES.find((a) => a.id === id)?.label.toLowerCase())
      .filter(Boolean) as string[];
    if (labels.length) parts.push(`It's tied up with ${listWords(labels)}.`);
  }
  if (draft.note.trim()) parts.push(draft.note.trim());
  return parts.join(" ");
}

function listWords(words: string[]): string {
  if (words.length <= 1) return words[0] ?? "";
  if (words.length === 2) return `${words[0]} and ${words[1]}`;
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}
