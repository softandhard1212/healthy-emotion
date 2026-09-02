import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { FileText } from "lucide-react-native";
import { ScreenBackground } from "../../../components/ScreenBackground";
import { EmotionCard } from "../../../components/EmotionCard";
import { MonthCalendar } from "../../../components/MonthCalendar";
import { QuadrantBubbles } from "../../../components/QuadrantBubbles";
import { Button } from "../../../components/Button";
import { Text } from "../../../theme/Text";
import { tokens } from "../../../theme";
import { useJournal } from "../../../lib/useJournal";
import { splitByActivity, summarizeCheckIns } from "../../../lib/journal";
import { JOURNAL_VIEWS, type JournalView } from "../../../lib/navigation";
import { activityLabel } from "../../../lib/emotions";

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * Journal — the record, two ways.
 *
 * Entries is the calendar and the cards for the day picked on it. Trends is
 * the shape of the month: where check-ins landed and what they were tied to.
 * Both read the same entries; the switch only changes the reading.
 */
export default function Journal() {
  const router = useRouter();
  const { entries, loading, error, refresh } = useJournal();
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const [view, setView] = useState<JournalView>("entries");
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState<Date | null>(new Date());
  const [fullCalendar, setFullCalendar] = useState(false);

  const all = entries ?? [];
  const inMonth = useMemo(
    () => all.filter((e) => { const d = new Date(e.created_at); return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth(); }),
    [all, month],
  );
  const onDay = useMemo(() => (selected ? all.filter((e) => sameDay(new Date(e.created_at), selected)) : []), [all, selected]);
  const summary = useMemo(() => summarizeCheckIns(inMonth), [inMonth]);
  const byActivity = useMemo(() => splitByActivity(inMonth).slice(0, 5), [inMonth]);

  const empty = !loading && !error && all.length === 0;

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.body}>
          <Text variant="heading.h1">Journal</Text>
          <Text variant="body.small" tone="secondary">
            What's been showing up across your check-ins.
          </Text>

          <View style={styles.segment}>
            {JOURNAL_VIEWS.map((v) => (
              <Pressable key={v.id} onPress={() => setView(v.id)} accessibilityRole="tab" accessibilityState={{ selected: view === v.id }} style={[styles.segmentItem, view === v.id && styles.segmentOn]}>
                <Text variant="ui.label-default" tone={view === v.id ? "primary" : "secondary"}>{v.label}</Text>
              </Pressable>
            ))}
          </View>

          {loading && <Text tone="secondary">Loading…</Text>}
          {error && <Text color={tokens.color.primitives.mood["high-unpleasant"].text}>{error}</Text>}

          {empty && (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <FileText size={28} color={tokens.color.semantic.text.tertiary} />
              </View>
              <Text variant="body.default" tone="secondary" style={styles.center}>
                Nothing here yet. After a conversation, this is where the thought underneath the feeling gets written down — with the pattern it fits, and one line to come back to.
              </Text>
              <Button label="Start a check-in" variant="secondary" onPress={() => router.push("/check-in")} style={styles.emptyCta} />
            </View>
          )}

          {!empty && view === "entries" && (
            <>
              <View style={styles.card}>
                <MonthCalendar month={month} entries={all} selected={selected} onSelect={setSelected} onMonthChange={(m) => { setMonth(m); setSelected(null); }} compact={!fullCalendar} />
                <Pressable onPress={() => setFullCalendar((f) => !f)} style={styles.expand} hitSlop={8}>
                  <Text variant="ui.caption" tone="secondary">{fullCalendar ? "Show week" : "Show month"}</Text>
                </Pressable>
              </View>
              {onDay.length === 0 && selected && (
                <Text variant="body.small" tone="secondary" style={styles.center}>
                  No check-ins on this day.
                </Text>
              )}
              {onDay.map((e) => (
                <EmotionCard key={e.id} entry={e} onPress={() => router.push(`/journal/${e.id}`)} onTalk={() => router.push({ pathname: "/talk", params: { entryId: e.id } })} />
              ))}
            </>
          )}

          {!empty && view === "trends" && (
            <>
              <Text variant="heading.h3">The shape of the month</Text>
              {inMonth.length === 0 ? (
                <Text variant="body.small" tone="secondary">No check-ins this month yet.</Text>
              ) : (
                <>
                  <View style={styles.card}>
                    <Text variant="body.overline" tone="secondary">Emotions</Text>
                    <QuadrantBubbles counts={summary.quadrants} />
                  </View>
                  {byActivity.length > 0 && (
                    <View style={styles.card}>
                      <Text variant="body.overline" tone="secondary">Tied to</Text>
                      {byActivity.map((s) => (
                        <View key={s.label} style={styles.splitRow}>
                          <Text variant="body.small">{activityLabel(s.label)}</Text>
                          <Text variant="mono.default" tone="secondary">{s.total}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { padding: tokens.spacing["24"], gap: tokens.spacing["12"], paddingBottom: tokens.spacing["40"] },
  segment: { flexDirection: "row", backgroundColor: "rgba(255, 255, 255, 0.5)", borderRadius: tokens.radius.full, padding: 3, marginVertical: tokens.spacing["8"] },
  segmentItem: { flex: 1, alignItems: "center", paddingVertical: tokens.spacing["8"], borderRadius: tokens.radius.full },
  segmentOn: { backgroundColor: tokens.color.semantic.bg.surface },
  card: { backgroundColor: "rgba(255, 255, 255, 0.55)", borderRadius: tokens.radius.xl, padding: tokens.spacing["16"], gap: tokens.spacing["10"] },
  expand: { alignSelf: "center", paddingTop: tokens.spacing["4"] },
  empty: { alignItems: "center", gap: tokens.spacing["16"], paddingVertical: tokens.spacing["48"], paddingHorizontal: tokens.spacing["16"] },
  emptyIcon: { width: 64, height: 64, borderRadius: tokens.radius.lg, backgroundColor: "rgba(255, 255, 255, 0.5)", alignItems: "center", justifyContent: "center" },
  emptyCta: { marginTop: tokens.spacing["8"] },
  center: { textAlign: "center" },
  splitRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: tokens.spacing["4"] },
});
