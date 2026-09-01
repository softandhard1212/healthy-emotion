import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { ScreenBackground } from "../../../components/ScreenBackground";
import { PeopleCluster } from "../../../components/PeopleCluster";
import { Text } from "../../../theme/Text";
import { quadrantColors, tokens } from "../../../theme";
import { useJournal } from "../../../lib/useJournal";
import { dominantQuadrant, summarizePatterns, summarizePeople } from "../../../lib/journal";
import { patternDetail, patternLabel } from "../../../lib/patterns";
import { shortDate } from "../../../lib/format";

const COLLAPSED = 62;
const STEP = 64;

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

/**
 * Patterns — what keeps coming back, and who.
 *
 * The cards are a stack, as the `15` frame draws them: one card open, the
 * rest collapsed to their header and tucked 64px apart beneath it, each
 * tinted by the quadrant the pattern mostly occurs in. Tapping a collapsed
 * card brings it to the top open; tapping the open one goes to its detail.
 */
export default function Patterns() {
  const router = useRouter();
  const { entries, loading, error, refresh } = useJournal();
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const stats = useMemo(() => (entries ? summarizePatterns(entries) : []), [entries]);
  const people = useMemo(() => (entries ? summarizePeople(entries) : []), [entries]);
  const byId = useMemo(() => new Map((entries ?? []).map((e) => [e.id, e])), [entries]);
  const open = openSlug ?? stats[0]?.slug ?? null;
  const ordered = useMemo(() => (open ? [...stats.filter((s) => s.slug === open), ...stats.filter((s) => s.slug !== open)] : stats), [stats, open]);

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.body}>
          <Text variant="body.overline" color="rgba(53, 40, 64, 0.92)">Patterns</Text>
          <Text variant="heading.h1" color="rgba(53, 40, 64, 0.92)">{"What is\nframing your mind"}</Text>

          {loading && <Text tone="secondary">Loading…</Text>}
          {error && <Text color={tokens.color.primitives.mood["high-unpleasant"].text}>{error}</Text>}
          {!loading && !error && stats.length === 0 && (
            <Text variant="body.default" tone="secondary">
              Nothing recurring yet. Patterns show up here after a few conversations.
            </Text>
          )}

          {ordered.length > 0 && (
            <View style={[styles.stack, { height: 185 + (ordered.length - 1) * STEP }]}>
              {ordered.map((stat, i) => {
                const q = dominantQuadrant(stat, byId);
                const tint = q ? quadrantColors(q).cardTint : tokens.color.semantic.bg["surface-warm"];
                const detail = patternDetail(stat.slug);
                const expanded = i === 0;
                return (
                  <Pressable
                    key={stat.slug}
                    onPress={() => (expanded ? router.push(`/patterns/${stat.slug}`) : setOpenSlug(stat.slug))}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.card,
                      { backgroundColor: tint, top: expanded ? 0 : 185 - COLLAPSED + i * STEP, zIndex: expanded ? 10 : 10 + i },
                      expanded ? styles.expanded : styles.collapsed,
                      pressed && { opacity: 0.92 },
                    ]}
                  >
                    <View style={styles.header}>
                      <Text variant="brand.card-title">{patternLabel(stat.slug)}</Text>
                      <Text variant="brand.card-meta" style={styles.dim}>
                        {stat.count} {stat.count === 1 ? "entry" : "entries"}
                      </Text>
                    </View>
                    {expanded && (
                      <View style={styles.cardBody}>
                        {detail?.question ? (
                          <Text variant="brand.card-body" style={styles.dimmer}>{detail.question}</Text>
                        ) : null}
                        <View style={styles.divider} />
                        <View style={styles.meta}>
                          <Text variant="brand.card-meta" style={styles.dim}>Last session</Text>
                          <Text variant="brand.card-meta-bold">{isToday(stat.lastSeen) ? "Today" : shortDate(stat.lastSeen)}</Text>
                        </View>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          {people.length > 0 && (
            <View style={styles.people}>
              <Text variant="heading.h1">Who is occurring in your mind</Text>
              <PeopleCluster people={people} />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { paddingHorizontal: tokens.spacing["20"], paddingTop: tokens.spacing["16"], paddingBottom: tokens.spacing["40"], gap: tokens.spacing["12"] },
  stack: { position: "relative", marginTop: tokens.spacing["16"] },
  card: { position: "absolute", left: 0, right: 0, borderWidth: 1 },
  expanded: {
    height: 185,
    borderRadius: tokens.radius.xl,
    borderColor: "rgba(255, 255, 255, 0.8)",
    padding: tokens.spacing["16"],
    gap: tokens.spacing["12"],
    shadowColor: "#4F335C",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  collapsed: {
    height: COLLAPSED,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderColor: "rgba(255, 255, 255, 0.9)",
    paddingTop: tokens.spacing["12"],
    paddingHorizontal: tokens.spacing["16"],
    paddingBottom: tokens.spacing["8"],
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  header: { gap: 2 },
  cardBody: { gap: tokens.spacing["10"] },
  divider: { height: 1, backgroundColor: tokens.color.semantic.text.primary, opacity: 0.12 },
  meta: { flexDirection: "row", justifyContent: "space-between" },
  dim: { opacity: 0.75 },
  dimmer: { opacity: 0.85 },
  people: { marginTop: tokens.spacing["32"], gap: tokens.spacing["16"] },
});
