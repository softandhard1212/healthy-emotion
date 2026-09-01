import { StyleSheet, View } from "react-native";
import { Text } from "../theme/Text";
import { quadrantColors, tokens } from "../theme";
import { QUADRANTS, type QuadrantId } from "../lib/emotions";

/**
 * The "shape of the month": four circles, one per quadrant, sized by how many
 * check-ins landed there and overlapping like the design's venn. Area, not
 * radius, tracks the count — a quadrant with twice the entries should look
 * twice as big, and radius-scaling would make it four times.
 */
export function QuadrantBubbles({ counts }: { counts: Record<string, number> }) {
  const max = Math.max(1, ...Object.values(counts));
  const size = (q: QuadrantId) => 56 + 84 * Math.sqrt((counts[q] ?? 0) / max);
  // Placement echoes the circumplex: unpleasant left, pleasant right, high up.
  const place: Record<QuadrantId, { left: number; top: number }> = {
    highUnpleasant: { left: 0.08, top: 0.05 },
    highPleasant: { left: 0.55, top: 0.02 },
    lowUnpleasant: { left: 0.16, top: 0.42 },
    lowPleasant: { left: 0.58, top: 0.45 },
  };
  return (
    <View>
      <View style={styles.field}>
        {(Object.keys(place) as QuadrantId[]).map((q) => {
          const d = size(q);
          const { bg, ink } = quadrantColors(q);
          return (
            <View
              key={q}
              style={[styles.circle, { width: d, height: d, borderRadius: d / 2, backgroundColor: bg, left: `${place[q].left * 100}%`, top: `${place[q].top * 100}%` }]}
            >
              <Text variant="heading.h2" color={ink}>
                {counts[q] ?? 0}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        {(Object.keys(place) as QuadrantId[]).map((q) => (
          <View key={q} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: quadrantColors(q).bg }]} />
            <Text variant="ui.caption" tone="secondary">
              {QUADRANTS[q].title}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { height: 220, position: "relative" },
  circle: { position: "absolute", alignItems: "center", justifyContent: "center", opacity: 0.88 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: tokens.spacing["10"], marginTop: tokens.spacing["12"] },
  legendItem: { flexDirection: "row", alignItems: "center", gap: tokens.spacing["4"] },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
