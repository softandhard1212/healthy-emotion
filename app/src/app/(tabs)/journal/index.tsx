import { useCallback, useMemo, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppMenu } from "../../../components/AppMenu";
import { MonthCalendar } from "../../../components/MonthCalendar";
import { Text } from "../../../theme/Text";
import { tokens, quadrantForPoint } from "../../../theme";
import { useJournal } from "../../../lib/useJournal";
import type { JournalEntry } from "../../../lib/journal";

const CARD_GRADIENTS = {
  highUnpleasant: ["#CC5730", "#D86A58", "#DD886E"],
  highPleasant: ["#D77D5E", "#DFAD6F", "#DFAE7B"],
  lowUnpleasant: ["#3D85B8", "#5B75B5", "#7A4CAD"],
  lowPleasant: ["#298775", "#499887", "#67A792"],
} as const;

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function JournalCard({ entry, onPress }: { entry: JournalEntry; onPress: () => void }) {
  const quadrant = quadrantForPoint(entry.point_x ?? 0, entry.point_y ?? 0);
  const title = entry.reflection.trim() || entry.trigger.trim() || entry.emotion;
  const date = new Date(entry.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <LinearGradient
        colors={[...CARD_GRADIENTS[quadrant]]}
        locations={[0, 0.54, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.card}
      >
        <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
        <Text style={styles.cardDate}>{date}</Text>
      </LinearGradient>
    </Pressable>
  );
}

/** The current Figma Journal: one collapsed week followed by its entries. */
export default function Journal() {
  const router = useRouter();
  const { entries, refresh, preview } = useJournal();
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const [month, setMonth] = useState(() => preview ? new Date(2026, 7, 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState<Date>(() => preview ? new Date(2026, 7, 26) : new Date());
  const all = entries ?? [];
  const visibleEntries = useMemo(() => {
    const from = startOfWeek(selected).getTime();
    const to = from + 7 * 24 * 60 * 60 * 1000;
    return all.filter((entry) => {
      const at = new Date(entry.created_at).getTime();
      return at >= from && at < to;
    });
  }, [all, selected]);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <AppMenu active="journal" />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <MonthCalendar
            month={month}
            entries={all}
            selected={selected}
            compact
            onSelect={setSelected}
            onMonthChange={(next) => {
              setMonth(next);
              setSelected(new Date(next.getFullYear(), next.getMonth(), 1));
            }}
          />
          <View style={styles.cards}>
            {visibleEntries.map((entry) => (
              <JournalCard key={entry.id} entry={entry} onPress={() => router.push(`/journal/${entry.id}`)} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F1EDE7" },
  safe: { flex: 1 },
  content: { paddingTop: 54, paddingHorizontal: tokens.spacing["24"], paddingBottom: tokens.spacing["40"] },
  cards: { gap: 48, marginTop: 34 },
  card: {
    height: 134,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: tokens.spacing["12"],
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing["20"],
    shadowColor: "#4F335C",
    shadowOpacity: 0.05,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  cardTitle: { flex: 1, fontFamily: "Lora_700Bold", fontSize: 20, lineHeight: 26, color: tokens.color.semantic.text.inverse },
  cardDate: { fontFamily: "Nunito_600SemiBold", fontSize: 12, lineHeight: 16, color: tokens.color.semantic.text.inverse },
  pressed: { opacity: 0.82 },
});
