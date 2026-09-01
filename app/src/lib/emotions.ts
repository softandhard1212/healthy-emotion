/**
 * The emotion vocabulary behind the three-step check-in.
 *
 * Every word carries its own place on Russell's circumplex — x is
 * pleasantness, y is energy, both -10..+10 — rather than just a quadrant tag.
 * That does three jobs at once: it colours each bubble by how intense the word
 * is, it orders the field so the grid reads as a gradient instead of four
 * boxes, and it recovers the coordinates the old drag-grid used to capture.
 * The logged point is the centroid of whatever was picked, which is a truer
 * reading than one tap: "exhausted and relieved" lands honestly between them.
 *
 * Definitions exist because half of emotional granularity is knowing the
 * difference between two near-neighbours — someone who can tell "discouraged"
 * from "frustrated" is already partway to knowing what to do about it.
 */

export type QuadrantId =
  | "highPleasant"
  | "lowPleasant"
  | "highUnpleasant"
  | "lowUnpleasant";

export interface Quadrant {
  id: QuadrantId;
  title: string;
  /** Which half of the grid this corner is in. Neither is the good one. */
  tone: "cool" | "warm";
  /** One line naming the felt state, for people who don't recognise the words. */
  hint: string;
  /** Base pastel for the quadrant's bubbles, and its readable ink. */
  tint: string;
  ink: string;
  border: string;
}

export const QUADRANTS: Record<QuadrantId, Quadrant> = {
  highUnpleasant: {
    id: "highUnpleasant",
    tone: "cool",
    title: "High energy, unpleasant",
    hint: "Keyed up, and it doesn't feel good.",
    tint: "#f2a894",
    ink: "#8d3823",
    border: "#e2a08f",
  },
  highPleasant: {
    id: "highPleasant",
    tone: "warm",
    title: "High energy, pleasant",
    hint: "Lit up, with energy behind it.",
    tint: "#f4c877",
    ink: "#84540f",
    border: "#e8c98a",
  },
  lowUnpleasant: {
    id: "lowUnpleasant",
    tone: "cool",
    title: "Low energy, unpleasant",
    hint: "Heavy, flat, or worn down.",
    tint: "#aeb3e0",
    ink: "#3b3e80",
    border: "#a7abdd",
  },
  lowPleasant: {
    id: "lowPleasant",
    tone: "warm",
    title: "Low energy, pleasant",
    hint: "Settled, and quiet with it.",
    tint: "#9ccfb8",
    ink: "#1c5c4a",
    border: "#93c9b3",
  },
};

/** Reading order: the four quadrants as they sit on the grid. */
export const QUADRANT_ORDER: QuadrantId[] = [
  "highUnpleasant",
  "highPleasant",
  "lowUnpleasant",
  "lowPleasant",
];

export interface Emotion {
  word: string;
  /** Pleasantness, -10 (unpleasant) to +10 (pleasant). */
  x: number;
  /** Energy, -10 (still) to +10 (activated). */
  y: number;
  /** Plain-language sense of the word, shown when it's picked. */
  definition: string;
}

export const EMOTIONS: Emotion[] = [
  // High energy, unpleasant
  { word: "Anxious", x: -5, y: 6, definition: "Bracing for something that hasn't happened yet." },
  { word: "Angry", x: -7, y: 8, definition: "Something you care about was crossed or treated unfairly." },
  { word: "Frustrated", x: -5, y: 5, definition: "Blocked from something you're trying to reach." },
  { word: "Overwhelmed", x: -6, y: 7, definition: "More is being asked of you than you can hold at once." },
  { word: "Stressed", x: -5, y: 7, definition: "Under pressure with too little room to meet it." },
  { word: "Scared", x: -7, y: 7, definition: "Sensing real danger, right now." },
  { word: "Restless", x: -3, y: 6, definition: "Unable to settle, without knowing quite why." },
  { word: "Irritated", x: -4, y: 4, definition: "Worn thin by something small and repeated." },
  { word: "Embarrassed", x: -5, y: 4, definition: "Exposed in a way you didn't choose." },
  { word: "Jealous", x: -6, y: 5, definition: "Afraid of losing something to someone else." },
  { word: "Nervous", x: -3, y: 5, definition: "Jittery about something specific and close." },
  { word: "Resentful", x: -6, y: 3, definition: "Anger that went quiet and stayed." },

  // High energy, pleasant
  { word: "Joyful", x: 8, y: 7, definition: "Lit up by something good, with nothing held back." },
  { word: "Excited", x: 7, y: 8, definition: "Pulled forward by something you're looking ahead to." },
  { word: "Proud", x: 7, y: 5, definition: "Pleased by something you did that took something of you." },
  { word: "Energised", x: 6, y: 8, definition: "Ready to move, with fuel to spend." },
  { word: "Playful", x: 7, y: 6, definition: "Light enough to mess about." },
  { word: "Hopeful", x: 6, y: 4, definition: "Expecting it might turn out well, without knowing it will." },
  { word: "Inspired", x: 7, y: 6, definition: "Moved to make or do something." },
  { word: "Confident", x: 6, y: 5, definition: "Trusting yourself to handle what's coming." },
  { word: "Amused", x: 6, y: 4, definition: "Something struck you as funny." },
  { word: "Affectionate", x: 7, y: 3, definition: "Warm towards someone, and close to them." },
  { word: "Determined", x: 5, y: 7, definition: "Set on doing it, whatever it takes." },
  { word: "Enthusiastic", x: 7, y: 7, definition: "All in on something, and showing it." },

  // Low energy, unpleasant
  { word: "Sad", x: -6, y: -5, definition: "Something is lost or missing, and it matters." },
  { word: "Lonely", x: -6, y: -4, definition: "Wanting to be known, and not being." },
  { word: "Bored", x: -3, y: -5, definition: "Nothing in front of you is worth your attention." },
  { word: "Exhausted", x: -4, y: -8, definition: "Spent — not just tired, but past what rest today can fix." },
  { word: "Numb", x: -4, y: -7, definition: "Feeling turned down to almost nothing." },
  { word: "Discouraged", x: -5, y: -4, definition: "Losing confidence that the effort will pay off." },
  { word: "Guilty", x: -6, y: -3, definition: "You acted against what you believe you owe someone." },
  { word: "Hopeless", x: -8, y: -6, definition: "Unable to picture it getting better." },
  { word: "Withdrawn", x: -4, y: -6, definition: "Pulled back from people, on purpose or not." },
  { word: "Disappointed", x: -5, y: -3, definition: "It fell short of what you'd let yourself expect." },
  { word: "Insecure", x: -5, y: -2, definition: "Unsure you measure up to what's being asked." },
  { word: "Apathetic", x: -3, y: -6, definition: "Nothing in reach seems worth caring about." },

  // Low energy, pleasant
  { word: "Calm", x: 5, y: -5, definition: "Nothing is pulling at you." },
  { word: "Content", x: 6, y: -4, definition: "This is enough, as it is." },
  { word: "Grateful", x: 7, y: -3, definition: "Aware of something good you were given." },
  { word: "Peaceful", x: 6, y: -6, definition: "Quiet inside, with nothing unresolved pressing." },
  { word: "Relieved", x: 6, y: -4, definition: "A weight you were carrying has just been set down." },
  { word: "Rested", x: 5, y: -6, definition: "Refilled — you have something to spend again." },
  { word: "Safe", x: 6, y: -5, definition: "Nothing here can reach you right now." },
  { word: "Tender", x: 5, y: -3, definition: "Soft towards someone, a little open." },
  { word: "Satisfied", x: 6, y: -2, definition: "Something is finished, and finished well." },
  { word: "Reflective", x: 4, y: -4, definition: "Turning something over, without hurry." },
  { word: "Trusting", x: 5, y: -2, definition: "Willing to let someone else carry part of it." },
  { word: "Loved", x: 7, y: -2, definition: "Held in mind by someone, and knowing it." },
];

export interface MoodPoint {
  x: number;
  y: number;
}

export function quadrantFor({ x, y }: MoodPoint): QuadrantId {
  if (y >= 0) return x >= 0 ? "highPleasant" : "highUnpleasant";
  return x >= 0 ? "lowPleasant" : "lowUnpleasant";
}

export function emotionsIn(quadrant: QuadrantId): Emotion[] {
  return EMOTIONS.filter((e) => quadrantFor(e) === quadrant);
}

export function findEmotion(word: string): Emotion | undefined {
  return EMOTIONS.find((e) => e.word === word);
}

/**
 * Where the selected words sit, taken together. Averaging is what lets two
 * words from different quadrants resolve to an honest middle rather than
 * forcing the person to pick a side.
 */
export function centroidOf(words: string[]): MoodPoint {
  const picked = words.map(findEmotion).filter(Boolean) as Emotion[];
  if (!picked.length) return { x: 0, y: 0 };
  const round = (n: number) => Number(n.toFixed(1));
  return {
    x: round(picked.reduce((s, e) => s + e.x, 0) / picked.length),
    y: round(picked.reduce((s, e) => s + e.y, 0) / picked.length),
  };
}

/** How far from neutral a point sits, 0..10 — drives the journal's intensity. */
export function intensityOf({ x, y }: MoodPoint): number {
  return Math.min(10, Math.round(Math.hypot(x, y) / Math.SQRT2));
}

/** Plain words for a point, for the summary and the coach's opening. */
export function describePoint({ x, y }: MoodPoint): string {
  const strength = (v: number) => {
    const n = Math.abs(v);
    if (n <= 2) return "slightly";
    if (n <= 6) return "fairly";
    return "very";
  };
  return `${strength(x)} ${x >= 0 ? "pleasant" : "unpleasant"}, ${strength(y)} ${
    y >= 0 ? "high" : "low"
  } energy`;
}

/**
 * A bubble's fill: the quadrant's pastel, mixed toward the page's warm white
 * by how mild the word is. Gentle words sit back, strong ones come forward,
 * so the field shades continuously instead of banding into four blocks.
 */
export function bubbleFill(emotion: Emotion): string {
  const reach = Math.min(1, Math.hypot(emotion.x, emotion.y) / 11);
  return mix("#faf8f5", QUADRANTS[quadrantFor(emotion)].tint, 0.28 + reach * 0.62);
}

function mix(from: string, to: string, amount: number): string {
  const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [r1, g1, b1] = parse(from);
  const [r2, g2, b2] = parse(to);
  const at = (a: number, b: number) =>
    Math.round(a + (b - a) * amount).toString(16).padStart(2, "0");
  return `#${at(r1, r2)}${at(g1, g2)}${at(b1, b2)}`;
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

/** An activity id back to its label; falls back to the raw id if unknown. */
export function activityLabel(id: string): string {
  return ACTIVITIES.find((a) => a.id === id)?.label ?? id;
}

/**
 * Where a point sits in the field, as fractions of width and height with the
 * origin at the top left — x runs unpleasant to pleasant, y runs high energy
 * to low, matching how the circumplex is drawn.
 *
 * Returned normalised rather than in pixels so the same reading drives a
 * plot at any size: multiply by the plot's measured width and height.
 */
export function plotPosition({ x, y }: MoodPoint): { fx: number; fy: number } {
  return { fx: (x + 10) / 20, fy: (10 - y) / 20 };
}

export interface MoodLogDraft {
  point: MoodPoint;
  quadrant: QuadrantId;
  emotions: string[];
  activities: string[];
  note: string;
}

/**
 * The opening the coach receives. It reads as something a person would say,
 * because the agent's first job is to reflect it back — and "x: -6" gives it
 * nothing to work with.
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
