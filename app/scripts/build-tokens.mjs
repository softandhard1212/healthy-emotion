/**
 * Generates `src/theme/tokens.generated.ts` from `src/theme/tokens.json`.
 *
 * The token file is the design system's source of truth and is expected to be
 * re-exported from design tooling, so the theme is generated rather than
 * hand-maintained: change tokens.json, run `npm run build:tokens`, and every
 * consumer moves with it.
 *
 * Three things have to change on the way from DTCG into React Native:
 *
 *  1. Dimensions are unitless numbers in RN, not "16px" strings.
 *  2. `{color.primitives.plum.900}` aliases have to be resolved to literals —
 *     RN has no cascade to resolve them at runtime.
 *  3. Typography cannot stay as family + numeric weight. RN picks a font by
 *     the exact family name that was loaded, so `Nunito` + `700` has to become
 *     the single name `Nunito_700Bold` that expo-font registers.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(readFileSync(join(here, "../src/theme/tokens.json"), "utf8"));

/** Resolve `{a.b.c}` alias chains against the token tree. */
function resolve(value, seen = new Set()) {
  if (typeof value !== "string") return value;
  const match = /^\{(.+)\}$/.exec(value.trim());
  if (!match) return value;
  const path = match[1];
  if (seen.has(path)) throw new Error(`Circular token alias: ${path}`);
  seen.add(path);
  let node = tokens;
  for (const key of path.split(".")) {
    node = node?.[key];
    if (node === undefined) throw new Error(`Unknown token alias: {${path}}`);
  }
  return resolve(node.$value, seen);
}

/** "16px" -> 16. RN styles are unitless density-independent pixels. */
const px = (v) => (typeof v === "string" && v.endsWith("px") ? parseFloat(v) : v);

/** Walk a token subtree, emitting a plain object of resolved leaf values. */
function collect(node, transform = resolve) {
  const out = {};
  for (const [key, child] of Object.entries(node)) {
    if (child && typeof child === "object" && "$value" in child) {
      out[key] = transform(child.$value);
    } else if (child && typeof child === "object") {
      out[key] = collect(child, transform);
    }
  }
  return out;
}

/**
 * Map a DTCG family + weight (+ style) onto the font name expo-font loads.
 * These names come from the @expo-google-fonts packages; they are the literal
 * keys that must also appear in the useFonts() call in src/theme/fonts.ts.
 */
const WEIGHT_NAMES = { 400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold", 800: "ExtraBold" };
function fontFamily({ fontFamily: family, fontWeight, fontStyle }) {
  const base = family.replace(/\s+/g, "");
  const weight = WEIGHT_NAMES[fontWeight];
  if (!weight) throw new Error(`No font file mapped for ${family} weight ${fontWeight}`);
  return `${base}_${fontWeight}${weight}${fontStyle === "italic" ? "_Italic" : ""}`;
}

/** A DTCG typography token becomes a ready-to-spread RN TextStyle. */
function textStyle(value) {
  const style = {
    fontFamily: fontFamily(value),
    fontSize: px(value.fontSize),
    lineHeight: px(value.lineHeight),
  };
  if (value.letterSpacing) style.letterSpacing = px(value.letterSpacing);
  if (value.textTransform) style.textTransform = value.textTransform;
  return style;
}

/**
 * `linear-gradient(90deg, #A 0%, #B 100%)` becomes the props expo-linear-gradient
 * takes. Only the 90deg (left-to-right) case appears in this design; anything
 * else should fail loudly rather than render at the wrong angle.
 */
function gradient(value) {
  if (typeof value !== "string" || !value.startsWith("linear-gradient")) {
    return { colors: [value, value], start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } };
  }
  const inner = value.slice(value.indexOf("(") + 1, value.lastIndexOf(")"));
  const [angle, ...stops] = inner.split(/,(?![^(]*\))/).map((s) => s.trim());
  if (angle !== "90deg") throw new Error(`Unhandled gradient angle: ${angle}`);
  return {
    colors: stops.map((s) => s.replace(/\s+\d+%$/, "")),
    start: { x: 0, y: 0.5 },
    end: { x: 1, y: 0.5 },
  };
}


/**
 * The strongest bubble fill each quadrant can take while its own text colour
 * still clears WCAG AA on it.
 *
 * The check-in shades a word's bubble by how far it sits from neutral, so
 * "angry" reads stronger than "irritated". How far that ramp may go is not a
 * free choice: push it and the label stops being readable. Rather than pick a
 * constant and hope, the ceiling is derived here from the tokens themselves,
 * so changing a quadrant's `bg` or `text` moves the ceiling with it and the
 * ramp can never outrun legibility.
 *
 * Warm quadrants cap lower than cool ones because their backgrounds are
 * lighter, which leaves less room under a mid-dark text colour.
 */
const AA_NORMAL = 4.5;
const srgb = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => srgb(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const blend = (a, b, t) =>
  "#" +
  [0, 1, 2]
    .map((i) => {
      const from = parseInt(a.slice(1 + i * 2, 3 + i * 2), 16);
      const to = parseInt(b.slice(1 + i * 2, 3 + i * 2), 16);
      return Math.round(from * (1 - t) + to * t).toString(16).padStart(2, "0");
    })
    .join("");

function bubbleCeilings() {
  const base = tokens.color.primitives.neutral["cream-light"].$value;
  const out = {};
  for (const [quadrant, mood] of Object.entries(tokens.color.primitives.mood)) {
    let max = 0;
    for (let t = 0; t <= 1.0001; t += 0.01) {
      if (contrast(mood.text.$value, blend(base, mood.bg.$value, t)) >= AA_NORMAL) max = t;
      else break;
    }
    out[quadrant] = Math.round(max * 100) / 100;
  }
  return out;
}

const out = {
  color: { primitives: collect(tokens.color.primitives), semantic: collect(tokens.color.semantic) },
  spacing: collect(tokens.spacing, (v) => px(resolve(v))),
  radius: collect(tokens.radius, (v) => px(resolve(v))),
  typography: {
    heading: collect(tokens.typography.heading, textStyle),
    body: collect(tokens.typography.body, textStyle),
    ui: collect(tokens.typography.ui, textStyle),
    mono: collect(tokens.typography.mono, textStyle),
  },
  bubbleCeiling: bubbleCeilings(),
  gradients: {
    "emotion-card": collect(tokens.gradients["emotion-card"], gradient),
    "pattern-card": collect(tokens.gradients["pattern-card"], resolve),
  },
};

const banner = `/**
 * GENERATED FILE — do not edit.
 * Run \`npm run build:tokens\` after changing src/theme/tokens.json.
 */\n\n`;

writeFileSync(
  join(here, "../src/theme/tokens.generated.ts"),
  banner + "export const tokens = " + JSON.stringify(out, null, 2) + " as const;\n",
);

console.log("  bubble ceilings:", JSON.stringify(out.bubbleCeiling));
const count = (o) => JSON.stringify(o).match(/#[0-9a-fA-F]{3,8}|rgba\(/g)?.length ?? 0;
console.log(`Generated tokens.generated.ts — ${count(out)} color values, ` +
  `${Object.keys(out.spacing).length} spacing steps, ${Object.keys(out.radius).length} radii, ` +
  `${Object.values(out.typography).reduce((n, g) => n + Object.keys(g).length, 0)} text styles.`);
