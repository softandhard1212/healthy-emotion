/**
 * Checks the contract the token file states about itself: that the `ink` for
 * each quadrant is readable on that quadrant's emotion-card gradient.
 *
 * The spec puts body text (16px) and small metadata (10-12px) directly on
 * those gradients, so WCAG AA's 4.5:1 for normal text is the bar, not the
 * 3:1 large-text allowance. And a gradient is not two colours: text sits on
 * every value between the stops, so the whole ramp is sampled rather than
 * just the endpoints — the worst point is often in the middle.
 *
 * Run via `npm run check:contrast`. Exits non-zero on a failure so a token
 * change that quietly breaks readability is caught rather than shipped.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(readFileSync(join(here, "../src/theme/tokens.json"), "utf8"));

const AA_NORMAL = 4.5;

const channel = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const mix = (a, b, t) =>
  "#" +
  [0, 1, 2]
    .map((i) => {
      const from = parseInt(a.slice(1 + i * 2, 3 + i * 2), 16);
      const to = parseInt(b.slice(1 + i * 2, 3 + i * 2), 16);
      return Math.round(from * (1 - t) + to * t).toString(16).padStart(2, "0");
    })
    .join("");

const failures = [];
for (const [quadrant, token] of Object.entries(tokens.gradients["emotion-card"])) {
  const ink = tokens.color.primitives.mood[quadrant].ink.$value;
  const [from, to] = token.$value.match(/#[0-9A-Fa-f]{6}/g);
  let worst = Infinity;
  let at = 0;
  for (let t = 0; t <= 1.0001; t += 0.02) {
    const ratio = contrast(ink, mix(from, to, t));
    if (ratio < worst) [worst, at] = [ratio, t];
  }
  const ok = worst >= AA_NORMAL;
  if (!ok) failures.push({ quadrant, ink, worst, at });
  console.log(
    `  ${quadrant.padEnd(16)} ink ${ink}  worst ${worst.toFixed(2)}:1 ` +
      `at ${(at * 100).toFixed(0)}% of ramp  ${ok ? "PASS" : "FAIL"}`,
  );
}

if (failures.length) {
  console.error(`\n${failures.length} quadrant(s) below WCAG AA ${AA_NORMAL}:1 for normal text.`);
  process.exit(1);
}
console.log(`\nAll quadrant inks meet WCAG AA (${AA_NORMAL}:1) across the full gradient.`);
