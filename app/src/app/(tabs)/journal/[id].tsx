import { Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { ScreenBackground } from "../../../components/ScreenBackground";
import { EmotionCard } from "../../../components/EmotionCard";
import { Text } from "../../../theme/Text";
import { tokens } from "../../../theme";
import { useJournal } from "../../../lib/useJournal";

/** One entry, expanded — the `04b · Expanded card` frame. Still, like the other reading screens. */
export default function Entry() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { entries } = useJournal();
  const entry = entries?.find((e) => e.id === id);

  return (
    <ScreenBackground still>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.body}>
          <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" hitSlop={8}>
            <ChevronLeft size={16} color={tokens.color.semantic.text.primary} />
            <Text variant="ui.label-default">Back to calendar</Text>
          </Pressable>
          <Text variant="heading.h1">I am feeling</Text>
          {entry ? (
            <EmotionCard entry={entry} expanded onTalk={() => router.push({ pathname: "/talk", params: { entryId: entry.id } })} />
          ) : (
            <Text tone="secondary">Loading…</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { padding: tokens.spacing["24"], gap: tokens.spacing["12"], paddingBottom: tokens.spacing["40"] },
  back: { flexDirection: "row", alignItems: "center", gap: 2, alignSelf: "flex-start" },
});
