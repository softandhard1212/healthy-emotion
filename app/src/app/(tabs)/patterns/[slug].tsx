import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Lightbulb } from "lucide-react-native";
import { ScreenBackground } from "../../../components/ScreenBackground";
import { Text } from "../../../theme/Text";
import { tokens } from "../../../theme";
import { useJournal } from "../../../lib/useJournal";
import { summarizePatterns } from "../../../lib/journal";
import { patternDetail, patternLabel } from "../../../lib/patterns";
import { activityLabel } from "../../../lib/emotions";
import { shortDate } from "../../../lib/format";

/**
 * One pattern, in the person's own words.
 *
 * "Say this instead" shows the most recent reframe written for this pattern
 * when there is one, and the pattern's loosening question otherwise — the
 * question is what the reframe is an answer to, so it is the honest fallback.
 */
export default function PatternDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { entries } = useJournal();
  const detail = patternDetail(slug);
  const stat = useMemo(() => (entries ? summarizePatterns(entries).find((s) => s.slug === slug) : undefined), [entries, slug]);
  const reframe = useMemo(() => {
    if (!entries || !stat) return null;
    const byId = new Map(entries.map((e) => [e.id, e]));
    for (const inst of stat.instances) {
      const r = byId.get(inst.entryId)?.reframe;
      if (r) return r;
    }
    return null;
  }, [entries, stat]);

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.body}>
          <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" hitSlop={8}>
            <ChevronLeft size={16} color={tokens.color.semantic.text.primary} />
            <Text variant="ui.label-default">Back</Text>
          </Pressable>

          <View style={styles.titleRow}>
            <Text variant="heading.h1" style={styles.title}>
              {patternLabel(slug)}
            </Text>
            {stat && (
              <View style={styles.badge}>
                <Text variant="ui.label-default">{stat.count}×</Text>
              </View>
            )}
          </View>
          {detail?.description ? (
            <Text variant="body.small" tone="secondary">
              {detail.description}
            </Text>
          ) : null}

          {(reframe || detail?.question) && (
            <View style={styles.instead}>
              <View style={styles.insteadHead}>
                <View style={styles.bulb}>
                  <Lightbulb size={14} color={tokens.color.semantic.text.primary} />
                </View>
                <Text variant="body.overline" tone="secondary">
                  Say this instead
                </Text>
              </View>
              <Text variant="body.large">{reframe ?? detail?.question}</Text>
            </View>
          )}

          {stat && stat.instances.length > 0 && (
            <>
              <Text variant="body.overline" tone="secondary" style={styles.section}>
                In your words
              </Text>
              <View style={styles.list}>
                {stat.instances.map((inst) => (
                  <View key={inst.entryId} style={styles.item}>
                    <View style={styles.itemHead}>
                      <Text variant="ui.caption" tone="secondary">
                        {shortDate(inst.at)}
                      </Text>
                      <Text variant="ui.caption" tone="secondary">
                        {[inst.emotion.toLowerCase(), ...inst.activities.map((a) => activityLabel(a).toLowerCase())].join(" · ")}
                      </Text>
                    </View>
                    <Text variant="body.italic">“{inst.said}”</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { padding: tokens.spacing["24"], gap: tokens.spacing["10"], paddingBottom: tokens.spacing["40"] },
  back: { flexDirection: "row", alignItems: "center", gap: 2, alignSelf: "flex-start", marginBottom: tokens.spacing["8"] },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: tokens.spacing["12"] },
  title: { flex: 1 },
  badge: { backgroundColor: "rgba(255, 255, 255, 0.6)", borderRadius: tokens.radius.full, paddingHorizontal: tokens.spacing["10"], paddingVertical: tokens.spacing["4"] },
  instead: { marginTop: tokens.spacing["12"], backgroundColor: "rgba(255, 255, 255, 0.65)", borderRadius: tokens.radius.xl, padding: tokens.spacing["20"], gap: tokens.spacing["10"] },
  insteadHead: { flexDirection: "row", alignItems: "center", gap: tokens.spacing["8"] },
  bulb: { width: 28, height: 28, borderRadius: 14, backgroundColor: tokens.color.primitives.plum["200"], alignItems: "center", justifyContent: "center" },
  section: { marginTop: tokens.spacing["16"] },
  list: { backgroundColor: "rgba(255, 255, 255, 0.5)", borderRadius: tokens.radius.xl, paddingHorizontal: tokens.spacing["16"] },
  item: { paddingVertical: tokens.spacing["12"], gap: tokens.spacing["4"], borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(53, 40, 64, 0.12)" },
  itemHead: { flexDirection: "row", justifyContent: "space-between" },
});
