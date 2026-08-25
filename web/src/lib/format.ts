/** Display helpers shared by the Journal and Trends pages. */

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function intensityTone(intensity: number): string {
  if (intensity <= 3) return "intensity-low";
  if (intensity <= 6) return "intensity-mid";
  return "intensity-high";
}
