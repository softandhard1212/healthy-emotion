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
import type { QuadrantId } from "../lib/emotions";

/** camelCase (app) -> kebab-case (design tokens). */
export const TOKEN_QUADRANT: Record<QuadrantId, keyof typeof tokens.color.primitives.mood> = {
  highUnpleasant: "high-unpleasant",
  highPleasant: "high-pleasant",
  lowPleasant: "low-pleasant",
  lowUnpleasant: "low-unpleasant",
};

export interface QuadrantColors {
  /** Readable ink for text on this quadrant's light surfaces. */
  text: string;
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
