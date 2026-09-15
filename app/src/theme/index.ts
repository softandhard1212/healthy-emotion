/**
 * The theme's public surface. Screens and components import from here.
 *
 * Rule: no raw hex, font name, or magic spacing number outside `src/theme/`.
 * Everything a screen needs is a token, so a change in tokens.json reaches the
 * whole app in one step.
 */
export { tokens } from "./tokens.generated";
export { quadrantColors, quadrantForPoint, bubbleFill, TOKEN_QUADRANT } from "./quadrant";
export type { QuadrantColors } from "./quadrant";
export { useAppFonts } from "./fonts";

import { tokens } from "./tokens.generated";

/** Shorthands for the values used on nearly every screen. */
export const color = tokens.color.semantic;
export const space = tokens.spacing;
export const radius = tokens.radius;
export const type = tokens.typography;
