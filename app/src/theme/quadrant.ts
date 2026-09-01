/**
 * The bridge between the app's quadrant ids and the design system's.
 *
 * `src/lib/emotions.ts` has named the four quadrants in camelCase since the
 * first version and every emotion, screen and stored entry refers to them that
 * way. The token file names the same four in kebab-case. Rather than rewrite
 * one to match the other, this module maps between them in the single place
 * that needs to know, so the token file stays a faithful copy of what design
 * exports and `emotions.ts` keeps the ids already written to the database.
 */
import { tokens } from "./tokens.generated";
import type { Emotion, QuadrantId } from "../lib/emotions";

/** camelCase (app) -> kebab-case (design tokens). */
export const TOKEN_QUADRANT: Record<QuadrantId, keyof typeof tokens.color.primitives.mood> = {
  highUnpleasant: "high-unpleasant",
  highPleasant: "high-pleasant",
  lowPleasant: "low-pleasant",
  lowUnpleasant: "low-unpleasant",
};

export interface QuadrantColors {
  /** The quadrant's colour for text on light surfaces — cream, white, card tints. */
  text: string;
  /**
   * The colour for text sitting directly on this quadrant's gradient.
   * Identical to `text` for three quadrants; darkened for high-unpleasant,
   * where the standard text colour fails WCAG AA on the coral-to-amber ramp.
   * Use it for anything on an emotion card, and `text` everywhere else.
   */
  ink: string;
  /** The quadrant's saturated base — mood bubble fills, quadrant cards. */
  bg: string;
  /** The palest step, for large washes behind content. */
  light: string;
  /** Flat tint behind a pattern card. */
  cardTint: string;
  /** expo-linear-gradient props for an emotion card. */
  gradient: (typeof tokens.gradients)["emotion-card"][keyof (typeof tokens.gradients)["emotion-card"]];
}

/**
 * Colour is assigned per quadrant, never per emotion — so a word added to the
 * vocabulary inherits its palette from where it sits on the circumplex and
 * needs no colour of its own.
 */
export function quadrantColors(id: QuadrantId): QuadrantColors {
  const key = TOKEN_QUADRANT[id];
  const mood = tokens.color.primitives.mood[key];
  return {
    text: mood.text,
    ink: mood.ink,
    bg: mood.bg,
    light: mood.light,
    cardTint: tokens.gradients["pattern-card"][key],
    gradient: tokens.gradients["emotion-card"][key],
  };
}

/**
 * Which quadrant a point on the circumplex falls in. `emotions.ts` gives every
 * word an x (pleasantness) and y (energy) in -10..+10; this is the only rule
 * that turns those coordinates into a colour, and it is also what colours a
 * logged check-in from its stored centroid.
 */
export function quadrantForPoint(x: number, y: number): QuadrantId {
  if (y >= 0) return x >= 0 ? "highPleasant" : "highUnpleasant";
  return x >= 0 ? "lowPleasant" : "lowUnpleasant";
}

/** Linear blend between two hex colours; `amount` 0 returns `from`, 1 returns `to`. */
function mix(from: string, to: string, amount: number): string {
  const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [r1, g1, b1] = parse(from);
  const [r2, g2, b2] = parse(to);
  const at = (a: number, b: number) =>
    Math.round(a + (b - a) * amount).toString(16).padStart(2, "0");
  return `#${at(r1, r2)}${at(g1, g2)}${at(b1, b2)}`;
}

/**
 * The fill for a word's bubble in the check-in field.
 *
 * Shaded by how far the word sits from neutral, so "irritated" and "angry"
 * read as one family at two strengths rather than two equal chips. The ramp
 * runs from the pale background toward the quadrant's own colour, which is
 * what makes the whole field read as a gradient across the circumplex instead
 * of four flat boxes.
 *
 * This lived in `lib/emotions.ts` with its own hardcoded pastels until the
 * token file existed. It belongs here now: colour comes from tokens, and
 * `emotions.ts` is left holding only the vocabulary and its coordinates.
 */
export function bubbleFill(emotion: Emotion): string {
  const reach = Math.min(1, Math.hypot(emotion.x, emotion.y) / 11);
  const quadrant = quadrantForPoint(emotion.x, emotion.y);
  const tint = tokens.color.primitives.mood[TOKEN_QUADRANT[quadrant]].bg;
  return mix(tokens.color.primitives.neutral["cream-light"], tint, 0.28 + reach * 0.62);
}
