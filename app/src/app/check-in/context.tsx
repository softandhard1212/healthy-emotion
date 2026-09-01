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
import { ACTIVITIES, centroidOf, draftToMessage, quadrantFor } from "../../lib/emotions";
import { listWords } from "../../lib/format";
import { useCheckIn } from "../../lib/checkin";
import { useAuth } from "../../lib/AuthContext";
import { ensureThread } from "../../lib/thread";
import { sendMessage } from "../../lib/agent";

/**
 * Step 3 — what it is attached to, then hand the whole thing to the coach.
 *
 * Nothing is written to the journal from here. The draft becomes the opening
 * message of a conversation, and the agent logs the entry once it has heard
 * the thought behind the feeling — which is the part worth keeping, and the
 * part a form cannot ask for.
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
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const point = centroidOf(draft.emotions);
      const quadrant = draft.emotions.length ? quadrantFor(point) : draft.guess;
      if (!quadrant) throw new Error("Pick at least one word first.");
      const message = draftToMessage({ point, quadrant, emotions: draft.emotions, activities: draft.activities, note: draft.note });
      const threadId = await ensureThread(session.access_token);
      await sendMessage(session.access_token, threadId, message);
      reset();
      router.replace("/talk");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send that. Try again?");
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
            <Button label={busy ? "Sending…" : "Save entry"} onPress={save} disabled={busy} style={styles.save} />
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
