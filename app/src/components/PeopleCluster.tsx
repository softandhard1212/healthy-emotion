import { StyleSheet, View } from "react-native";
import { Text } from "../theme/Text";
import { quadrantColors, tokens } from "../theme";
import type { PersonStat } from "../lib/journal";

/**
 * "Who is occurring in your mind" — the people-cluster card from the
 * `15 · Patterns - list` frame, slot for slot.
 *
 * The frame draws five bubbles in fixed positions by rank: the most-mentioned
 * person large in the centre, the next two mid-height either side, the last
 * two small in the bottom corners. Rank decides the slot; the entries decide
 * the colour — each person takes the quadrant their mentions mostly fell in,
 * except Self, which the frame keeps lavender regardless.
 */
const SLOTS = [
  { size: 132, initial: "brand.initial-lg", style: { alignSelf: "center", top: "50%", marginTop: -66 - 10 } },
  { size: 96, initial: "brand.initial-md", style: { left: 28, top: "50%", marginTop: -48 + 18 } },
  { size: 96, initial: "brand.initial-md", style: { right: 28, top: "50%", marginTop: -48 + 18 } },
  { size: 78, initial: "brand.initial-sm", style: { left: 18, bottom: 18 } },
  { size: 78, initial: "brand.initial-sm", style: { right: 18, bottom: 18 } },
] as const;

export function PeopleCluster({ people }: { people: PersonStat[] }) {
  const shown = people.slice(0, SLOTS.length);
  return (
    <View style={styles.root}>
      <View style={styles.card}>
        {/* The frame's small bloom peeking in from the bottom-right corner. */}
        <View style={styles.bloom} />
        {shown.map((p, i) => {
          const slot = SLOTS[i];
          const fill =
            p.name.toLowerCase() === "self"
              ? tokens.color.primitives.plum["300"]
              : p.quadrant
                ? quadrantColors(p.quadrant).bg
                : tokens.color.primitives.plum["200"];
          return (
            <View
              key={p.name}
              style={[styles.bubble, { width: slot.size, height: slot.size, borderRadius: slot.size / 2, backgroundColor: fill }, slot.style as object]}
              accessibilityLabel={`${p.name}, ${p.count} mentions`}
            >
              <Text variant={slot.initial} color={tokens.color.semantic.text.inverse}>
                {p.name.trim().charAt(0).toUpperCase()}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.labels}>
        {shown.map((p) => (
          <View key={p.name} style={styles.label}>
            <Text variant="brand.card-meta-bold">{p.name}</Text>
            <Text variant="brand.person-count" style={styles.count}>
              {p.count} {p.count === 1 ? "mention" : "mentions"}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: tokens.spacing["16"] },
  card: {
    height: 220,
    borderRadius: tokens.radius.xl,
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
    overflow: "hidden",
    shadowColor: "#4F335C",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  bloom: {
    position: "absolute",
    right: -61,
    bottom: -61,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: tokens.color.primitives.mood["high-pleasant"].light,
    opacity: 0.8,
  },
  bubble: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  labels: { flexDirection: "row", justifyContent: "space-between" },
  label: { alignItems: "center", gap: 2 },
  count: { opacity: 0.75 },
});
