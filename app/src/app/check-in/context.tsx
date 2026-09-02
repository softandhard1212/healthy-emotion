import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ScreenBackground } from "../../components/ScreenBackground";
import { ContextTag } from "../../components/ContextTag";
import { StepDots } from "../../components/StepDots";
import { Button } from "../../components/Button";
import { Text } from "../../theme/Text";
import { tokens } from "../../theme";
import { ACTIVITIES, centroidOf, intensityOf, quadrantFor } from "../../lib/emotions";
import { listWords } from "../../lib/format";
import { useCheckIn } from "../../lib/checkin";
import { useAuth } from "../../lib/AuthContext";
import { createCheckIn } from "../../lib/journal";

/**
 * Step 3 — what it is attached to, then written straight to the journal.
 *
 * This is the entry itself: it shows on Today and in the Journal as soon as
 * it saves, with no conversation required. Talking it through is optional
 * and happens afterward, from the card — tapping "Talk it through" there
 * opens Talk with this entry's id, so the conversation finishes the same
 * row rather than starting a separate one.
 */
export default function Context() {
  const router = useRouter();
  const { session } = useAuth();
  const { draft, update, reset } = useCheckIn();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleActivity(id: string) {
    const on = draft.activities.includes(id);
    update({ activities: on ? draft.activities.filter((a) => a !== id) : [...draft.activities, id] });
  }

  async function save() {
    const email = session?.user.email;
    if (!email) return;
    setBusy(true);
    setError(null);
    try {
      const point = centroidOf(draft.emotions);
      const quadrant = draft.emotions.length ? quadrantFor(point) : draft.guess;
      if (!quadrant) throw new Error("Pick at least one word first.");
      await createCheckIn({
        userEmail: email,
        emotion: listWords(draft.emotions.map((w) => w.toLowerCase())),
        intensity: intensityOf(point),
        note: draft.note.trim(),
        activities: draft.activities,
        point,
      });
      reset();
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save that. Try again?");
      setBusy(false);
    }
  }

  return (
    <ScreenBackground still>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.safe}>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <StepDots active={2} />
            <Text variant="body.small" tone="secondary">
              I'm feeling
            </Text>
            <Text variant="brand.mood-title">{listWords(draft.emotions.map((w) => w.toLowerCase()))}</Text>

            <Text variant="body.overline" tone="secondary" style={styles.section}>
              Anything to do with
            </Text>
            <View style={styles.tags}>
              {ACTIVITIES.map((a) => (
                <View key={a.id} style={styles.tagCell}>
                  <ContextTag label={a.label} selected={draft.activities.includes(a.id)} onPress={() => toggleActivity(a.id)} />
                </View>
              ))}
            </View>

            <View style={styles.noteCard}>
              <TextInput
                value={draft.note}
                onChangeText={(note) => update({ note })}
                placeholder="More about what happened…"
                placeholderTextColor={tokens.color.semantic.text.tertiary}
                multiline
                textAlignVertical="top"
                style={styles.note}
              />
            </View>

            {error ? (
              <Text variant="body.small" color={tokens.color.primitives.mood["high-unpleasant"].text}>
                {error}
              </Text>
            ) : null}
          </ScrollView>

          <View style={styles.actions}>
            <Button label="Back" variant="ghost" onPress={() => router.back()} disabled={busy} />
            <Button label={busy ? "Saving…" : "Save entry"} onPress={save} disabled={busy} style={styles.save} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { paddingHorizontal: tokens.spacing["24"], paddingTop: tokens.spacing["8"], gap: tokens.spacing["6"] },
  section: { marginTop: tokens.spacing["20"], marginBottom: tokens.spacing["8"] },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: tokens.spacing["10"] },
  tagCell: { width: "31%", flexGrow: 1 },
  noteCard: {
    marginTop: tokens.spacing["16"],
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing["16"],
    minHeight: 96,
  },
  note: { ...tokens.typography.body.italic, color: tokens.color.semantic.text.primary, minHeight: 64 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing["12"],
    paddingHorizontal: tokens.spacing["24"],
    paddingVertical: tokens.spacing["12"],
  },
  save: { flex: 1 },
});
