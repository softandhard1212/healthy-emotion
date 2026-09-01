import { Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "../theme/Text";
import { quadrantColors, quadrantForPoint, tokens } from "../theme";
import { activityLabel } from "../lib/emotions";
import { patternLabel } from "../lib/patterns";
import type { JournalEntry } from "../lib/journal";

export interface EmotionCardProps {
  entry: JournalEntry;
  expanded?: boolean;
  onPress?: () => void;
}

/** "14:32" — the time alone; the date is carried by the list's grouping. */
function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/**
 * A journal entry on its quadrant's gradient.
 *
 * Every piece of text here uses the quadrant's `ink`, not `text` and not
 * white. The original design put white on these gradients, which measures
 * between 1.39:1 and 2.62:1 — unreadable, and worst on the two quadrants
 * someone is most likely to be reading while distressed. `ink` is the value
 * that clears 4.5:1 across the whole ramp, and `scripts/check-contrast.mjs`
 * holds that line as the tokens change.
 */
export function EmotionCard({ entry, expanded = false, onPress }: EmotionCardProps) {
  const quadrant = quadrantForPoint(entry.point_x ?? 0, entry.point_y ?? 0);
  const { ink, gradient } = quadrantColors(quadrant);
  const contexts = entry.activities ?? [];
  const patterns = entry.thinking_patterns ?? [];

  return (
    <Pressable onPress={onPress} accessibilityRole={onPress ? "button" : undefined}>
      <LinearGradient
        colors={gradient.colors as unknown as [string, string]}
        start={gradient.start}
        end={gradient.end}
        style={[styles.card, !expanded && styles.collapsed]}
      >
        <View style={styles.header}>
          <Text variant={expanded ? "heading.h1" : "body.large-bold"} color={ink}>
            {entry.emotion}
          </Text>
          <Text variant="ui.caption" color={ink}>
            {timeOf(entry.created_at)}
          </Text>
        </View>

        {contexts.length > 0 && (
          <View style={styles.chipRow}>
            {contexts.map((id) => (
              <View key={id} style={styles.chip}>
                <Text variant="ui.label-small" color={ink}>
                  {activityLabel(id)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {expanded && (
          <View style={styles.sections}>
            <Section label="HOW YOU FELT" body={entry.reflection} ink={ink} />
            <Section label="WHAT HAPPENED" body={entry.trigger} ink={ink} />
            {entry.automatic_thought ? (
              <Section label="THE THOUGHT" body={`“${entry.automatic_thought}”`} ink={ink} italic />
            ) : null}

            {patterns.length > 0 && (
              <View style={styles.chipRow}>
                {patterns.map((slug) => (
                  <View key={slug} style={[styles.chip, styles.patternChip]}>
                    <Text variant="ui.label-small" color={ink}>
                      {patternLabel(slug)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {entry.reframe ? (
              <View style={styles.frosted}>
                <Text variant="body.overline" color={ink}>
                  The new belief
                </Text>
                <Text variant="body.default" color={ink}>
                  {entry.reframe}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

function Section({
  label,
  body,
  ink,
  italic,
}: {
  label: string;
  body: string;
  ink: string;
  italic?: boolean;
}) {
  return (
    <View style={{ gap: tokens.spacing["4"] }}>
      <Text variant="body.overline" color={ink}>
        {label}
      </Text>
      <Text variant={italic ? "body.italic" : "body.default"} color={ink}>
        {body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing["20"],
    gap: tokens.spacing["12"],
  },
  // The design fixes the collapsed card at 134px tall; expanded grows freely.
  collapsed: { minHeight: 134, justifyContent: "space-between" },
  header: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: tokens.spacing["6"] },
  chip: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: tokens.radius.full,
    paddingVertical: tokens.spacing["4"],
    paddingHorizontal: tokens.spacing["10"],
  },
  patternChip: { backgroundColor: "rgba(255, 255, 255, 0.25)" },
  sections: { gap: tokens.spacing["16"] },
  frosted: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing["16"],
    gap: tokens.spacing["4"],
  },
});
