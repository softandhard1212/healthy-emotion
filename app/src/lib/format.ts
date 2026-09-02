/** Display helpers shared across the check-in, journal and trends views. */

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Day and month only, for dense lists where the year and time are noise. */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/**
 * Joins words the way a sentence would: "a", "a and b", "a, b and c".
 * Used where picked emotions are read back to the person as prose.
 */
export function listWords(words: string[]): string {
  if (words.length <= 1) return words[0] ?? "";
  if (words.length === 2) return `${words[0]} and ${words[1]}`;
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

/**
 * Which band an intensity falls in. Returns the band itself rather than a CSS
 * class name, as the web version did — the caller maps it to a token.
 */
export function intensityTone(intensity: number): "low" | "mid" | "high" {
  if (intensity <= 3) return "low";
  if (intensity <= 6) return "mid";
  return "high";
}
