import { useCallback, useMemo } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus } from "lucide-react-native";
import { ScreenBackground } from "../../components/ScreenBackground";
import { EmotionCard } from "../../components/EmotionCard";
import { Text } from "../../theme/Text";
import { tokens } from "../../theme";
import { useJournal } from "../../lib/useJournal";

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * Today — the check-in's front door, as the `04 · Check-in - calendar`
 * frame. With nothing logged yet it's one question and one large card to
 * tap, as designed; once a check-in exists for today it becomes the card
 * that's true to look at — the day's entries, with a smaller way back into
 * a new check-in above them.
 */
export default function Today() {
  const router = useRouter();
  const { entries, refresh } = useJournal();
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const today = useMemo(() => {
    const now = new Date();
    return (entries ?? []).filter((e) => sameDay(new Date(e.created_at), now));
  }, [entries]);

  function startCheckIn() {
    router.push("/check-in");
  }

  if (today.length === 0) {
    return (
      <ScreenBackground>
        <SafeAreaView edges={["top"]} style={styles.safe}>
          <View style={styles.body}>
            <Text variant="heading.h2">How are you doing?</Text>
            <Pressable onPress={startCheckIn} accessibilityRole="button" accessibilityLabel="Start a check-in" style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
              <View style={styles.plus}>
                <Plus size={22} color={tokens.color.semantic.text.primary} />
              </View>
              <Text variant="heading.h3">Log in</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.list}>
          <View style={styles.header}>
            <Text variant="heading.h2">How are you doing?</Text>
            <Pressable onPress={startCheckIn} accessibilityRole="button" accessibilityLabel="Start a check-in" style={({ pressed }) => [styles.plusSmall, pressed && { opacity: 0.85 }]}>
              <Plus size={20} color={tokens.color.semantic.text.primary} />
            </Pressable>
          </View>
          {today.map((entry) => (
            <EmotionCard
              key={entry.id}
              entry={entry}
              onPress={() => router.push(`/journal/${entry.id}`)}
              onTalk={() => router.push({ pathname: "/talk", params: { entryId: entry.id } })}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { padding: tokens.spacing["28"], gap: tokens.spacing["16"] },
  list: { padding: tokens.spacing["24"], gap: tokens.spacing["16"], paddingBottom: tokens.spacing["40"] },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  card: {
    height: 300,
    borderRadius: tokens.radius["2xl"],
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing["12"],
  },
  plus: { width: 64, height: 64, borderRadius: 32, backgroundColor: tokens.color.primitives.plum["200"], alignItems: "center", justifyContent: "center" },
  plusSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: tokens.color.primitives.plum["200"], alignItems: "center", justifyContent: "center" },
});
