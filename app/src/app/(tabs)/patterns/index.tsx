import { useCallback, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { ScreenBackground } from "../../../components/ScreenBackground";
import { SectionHeader } from "../../../components/SectionHeader";
import { Text } from "../../../theme/Text";
import { quadrantColors, tokens } from "../../../theme";
import { useJournal } from "../../../lib/useJournal";
import { dominantQuadrant, summarizePatterns } from "../../../lib/journal";
import { patternDetail, patternLabel } from "../../../lib/patterns";
import { shortDate } from "../../../lib/format";

/**
 * Patterns — what keeps coming back.
 *
 * Each card is tinted by the quadrant the pattern mostly occurs in for this
 * person, per the spec's frequency rule. A pattern with no located entries
 * falls back to the warm surface rather than inventing a colour.
 */
export default function Patterns() {
  const router = useRouter();
  const { entries, loading, error, refresh } = useJournal();
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const stats = useMemo(() => (entries ? summarizePatterns(entries) : []), [entries]);
  const byId = useMemo(() => new Map((entries ?? []).map((e) => [e.id, e])), [entries]);

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.body}>
          <SectionHeader overline="Patterns" title={"What is\nframing your mind"} />
          {loading && <Text tone="secondary">Loading…</Text>}
          {error && <Text color={tokens.color.primitives.mood["high-unpleasant"].text}>{error}</Text>}
          {!loading && !error && stats.length === 0 && (
            <Text variant="body.default" tone="secondary">
              Nothing recurring yet. Patterns show up here after a few conversations.
            </Text>
          )}
          {stats.map((stat) => {
            const q = dominantQuadrant(stat, byId);
            const tint = q ? quadrantColors(q).cardTint : tokens.color.semantic.bg["surface-warm"];
            const detail = patternDetail(stat.slug);
            return (
              <Pressable
                key={stat.slug}
                onPress={() => router.push(`/patterns/${stat.slug}`)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.card, { backgroundColor: tint }, pressed && { opacity: 0.9 }]}
              >
                <Text variant="heading.h3">{patternLabel(stat.slug)}</Text>
                <Text variant="heading.h5" tone="secondary">
                  {stat.count} {stat.count === 1 ? "entry" : "entries"}
                </Text>
                {detail?.description ? (
                  <Text variant="body.small" tone="secondary">
                    {detail.description}
                  </Text>
                ) : null}
                <View style={styles.footer}>
                  <Text variant="heading.h5" tone="tertiary">
                    Last session
                  </Text>
                  <Text variant="heading.h5" tone="tertiary">
                    {shortDate(stat.lastSeen)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { padding: tokens.spacing["24"], gap: tokens.spacing["12"], paddingBottom: tokens.spacing["40"] },
  card: { borderRadius: tokens.radius.xl, paddingVertical: tokens.spacing["16"], paddingHorizontal: tokens.spacing["20"], gap: tokens.spacing["8"] },
  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: tokens.spacing["4"] },
});
