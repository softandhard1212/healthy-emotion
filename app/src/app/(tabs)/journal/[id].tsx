import { useMemo, useState } from "react";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChatBubble } from "../../../components/ChatBubble";
import { Text } from "../../../theme/Text";
import { quadrantForPoint } from "../../../theme";
import type { JournalEntry } from "../../../lib/journal";
import { previewJournalPresentation, type PreviewJournalPresentation } from "../../../lib/previewJournal";
import { useJournal } from "../../../lib/useJournal";

type DetailTab = "transcript" | "analysis";

const WASHES = {
  highUnpleasant: ["rgba(216,106,88,0.56)", "rgba(216,106,88,0.14)", "rgba(251,246,241,0)"],
  highPleasant: ["rgba(201,120,54,0.50)", "rgba(223,173,111,0.15)", "rgba(251,246,241,0)"],
  lowUnpleasant: ["rgba(91,117,181,0.52)", "rgba(122,76,173,0.13)", "rgba(251,246,241,0)"],
  lowPleasant: ["rgba(62,143,126,0.48)", "rgba(73,152,135,0.13)", "rgba(251,246,241,0)"],
} as const;

function words(value: string | null | undefined, fallback: string): string[] {
  const result = value?.split(/\s+(?:and|&)\s+|,\s*/i).map((word) => word.trim()).filter(Boolean);
  return result?.length ? result : [fallback];
}

function presentationFor(entry: JournalEntry): PreviewJournalPresentation {
  return {
    title: entry.reflection.trim() || entry.trigger.trim() || entry.emotion,
    feelings: words(entry.emotion, "Present"),
    thoughtTags: entry.thinking_patterns?.length ? entry.thinking_patterns.map((item) => item.replaceAll("_", " ")) : ["A thought worth noticing"],
    supportiveBelief: entry.reframe?.trim() || entry.affirmation?.trim() || "I can meet this moment with care.",
    supportiveTags: ["A more supportive perspective"],
    shift: entry.bright_moment?.trim() || "You made room for a different way of seeing the moment.",
    transcript: [
      { role: "user", text: entry.trigger.trim() || entry.reflection.trim() || entry.emotion },
      { role: "ai", text: entry.automatic_thought?.trim() || "What did this moment seem to say about you?" },
      { role: "user", text: entry.reframe?.trim() || entry.affirmation?.trim() || "I can meet this with more care." },
    ],
  };
}

function Pill({ children }: { children: string }) {
  return <View style={styles.pill}><Text style={styles.pillText}>{children}</Text></View>;
}

function Analysis({ entry, presentation }: { entry: JournalEntry; presentation: PreviewJournalPresentation }) {
  return (
    <View style={styles.analysis}>
      <View style={styles.intro}>
        <Text style={styles.detailTitle}>{presentation.title}</Text>
        <Text style={styles.date}>{new Date(entry.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.eyebrow}>HOW YOU FELT</Text>
        <View style={styles.pillRow}>{presentation.feelings.map((item) => <Pill key={item}>{item}</Pill>)}</View>
      </View>
      <View style={styles.section}>
        <Text style={styles.eyebrow}>WHAT HAPPENED</Text>
        <Text style={styles.body}>{entry.trigger}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.eyebrow}>THE THOUGHT</Text>
        <Text style={styles.quote}>“{entry.automatic_thought}”</Text>
        <View style={styles.pillRow}>{presentation.thoughtTags.map((item) => <Pill key={item}>{item}</Pill>)}</View>
      </View>
      <View style={styles.supportiveCard}>
        <Text style={styles.eyebrow}>A MORE SUPPORTIVE BELIEF</Text>
        <Text style={styles.supportiveText}>“{presentation.supportiveBelief}”</Text>
        <View style={styles.pillRow}>{presentation.supportiveTags.map((item) => <Pill key={item}>{item}</Pill>)}</View>
      </View>
      <View style={styles.section}>
        <Text style={styles.eyebrow}>THE SHIFT</Text>
        <Text style={styles.shift}>{presentation.shift}</Text>
      </View>
    </View>
  );
}

function Transcript({ presentation }: { presentation: PreviewJournalPresentation }) {
  return (
    <View style={styles.transcript}>
      {presentation.transcript.map((turn, index) => (
        <View key={`${turn.role}-${index}`} style={styles.transcriptTurn}><ChatBubble role={turn.role} text={turn.text} /></View>
      ))}
    </View>
  );
}

/** Current Journal detail with the Figma Transcript / Analysis states. */
export default function EntryDetail() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const { entries } = useJournal();
  const [tab, setTab] = useState<DetailTab>("analysis");
  const entry = entries?.find((candidate) => candidate.id === id);
  const presentation = useMemo(() => entry ? previewJournalPresentation(entry.id) ?? presentationFor(entry) : null, [entry]);
  const wash = entry ? WASHES[quadrantForPoint(entry.point_x ?? 0, entry.point_y ?? 0)] : WASHES.highUnpleasant;

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[...wash]} locations={[0, 0.34, 0.74]} style={styles.wash} />
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to Journal" hitSlop={10} onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <ChevronLeft size={20} color="#352840" />
          </Pressable>
          <BlurView intensity={34} tint="light" style={styles.switcher}>
            {(["transcript", "analysis"] as DetailTab[]).map((item) => {
              const selected = tab === item;
              return (
                <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => setTab(item)} style={({ pressed }) => [styles.tab, selected && styles.tabSelected, pressed && styles.pressed]}>
                  <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{item === "transcript" ? "Transcript" : "Analysis"}</Text>
                </Pressable>
              );
            })}
          </BlurView>
          <View style={styles.topSpacer} />
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {!entry || !presentation ? <Text style={styles.body}>Loading…</Text> : tab === "analysis" ? <Analysis entry={entry} presentation={presentation} /> : <Transcript presentation={presentation} />}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FBF6F1" },
  wash: { ...StyleSheet.absoluteFill },
  safe: { flex: 1 },
  topBar: { height: 70, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: "rgba(255,255,255,0.24)" },
  topSpacer: { width: 40 },
  switcher: { width: 210, height: 44, flexDirection: "row", overflow: "hidden", borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.72)", backgroundColor: "rgba(250,247,240,0.44)", padding: 3 },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 18 },
  tabSelected: { backgroundColor: "rgba(255,255,255,0.72)" },
  tabText: { fontFamily: "Nunito_600SemiBold", fontSize: 12, lineHeight: 16, color: "rgba(53,40,64,0.58)" },
  tabTextSelected: { color: "#352840" },
  content: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 52 },
  analysis: { gap: 36 },
  intro: { gap: 5 },
  detailTitle: { fontFamily: "Lora_700Bold", fontSize: 30, lineHeight: 38, color: "#352840" },
  date: { fontFamily: "Nunito_600SemiBold", fontSize: 12, lineHeight: 16, color: "rgba(53,40,64,0.56)" },
  section: { gap: 12 },
  eyebrow: { fontFamily: "Nunito_800ExtraBold", fontSize: 10, lineHeight: 14, letterSpacing: 1.1, color: "rgba(53,40,64,0.58)" },
  body: { fontFamily: "Lora_400Regular", fontSize: 17, lineHeight: 25, color: "#352840" },
  quote: { fontFamily: "Lora_400Regular", fontSize: 21, lineHeight: 31, color: "#352840" },
  shift: { fontFamily: "Lora_400Regular", fontSize: 22, lineHeight: 32, color: "#352840" },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  pill: { minHeight: 28, justifyContent: "center", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.70)", backgroundColor: "rgba(255,255,255,0.38)", paddingHorizontal: 11, paddingVertical: 5 },
  pillText: { fontFamily: "Nunito_600SemiBold", fontSize: 11, lineHeight: 15, color: "rgba(53,40,64,0.76)" },
  supportiveCard: { gap: 13, overflow: "hidden", borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.74)", backgroundColor: "rgba(255,255,255,0.30)", padding: 21 },
  supportiveText: { fontFamily: "Lora_700Bold", fontSize: 23, lineHeight: 32, color: "#352840" },
  transcript: { gap: 38, paddingTop: 20, paddingBottom: 44 },
  transcriptTurn: { minHeight: 28 },
  pressed: { opacity: 0.65 },
});
