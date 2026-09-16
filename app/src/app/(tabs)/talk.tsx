import { useCallback, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { ArrowUp, Star } from "lucide-react-native";
import { ChatBubble } from "../../components/ChatBubble";
import { MoodPickerSheet } from "../../components/MoodPickerSheet";
import { AppMenu } from "../../components/AppMenu";
import { Text } from "../../theme/Text";
import { tokens } from "../../theme";
import { useAuth } from "../../lib/AuthContext";
import { AgentError, createThread, fetchThreadHistory, isVisible, sendMessage, type AgentMessage } from "../../lib/agent";
import { clearThread, ensureThread, getThreadId } from "../../lib/thread";
import { entryToMessage, fetchEntry, fetchJournalEntries, setAffirmationSaved } from "../../lib/journal";
import { listWords } from "../../lib/format";

const talkLightSource = require("../../../assets/talk-light-source.png");
const talkActiveLight = require("../../../assets/talk-active-light.png");

const PREVIEW_OPENING_QUESTION = "What feels most present for you today?";
const PREVIEW_RESPONSES = [
  "That sounds painful. When the comparison appears, what does it seem to say about you?",
  "That makes sense. When did slowing down begin to feel like falling behind?",
  "So the pressure has been trying to keep you safe. We can stay with that—what does it fear would happen first?",
] as const;

/** The affirmation the agent wrote when it logged an entry, if this turn logged one. */
function affirmationIn(m: AgentMessage): string | null {
  const call = m.tool_calls?.find((c) => c.name === "log_emotion_entry");
  const text = call?.args?.affirmation;
  return typeof text === "string" && text.trim() ? text : null;
}

/**
 * Talk — the conversation with the coach.
 *
 * When the agent logs an entry, its affirmation is pulled out of the tool
 * call and shown as the "one line to keep" card, with a Keep button. Keeping
 * marks `affirmation_saved` on the entry, which is the single write the
 * client is allowed — the database trigger refuses anything else.
 *
 * A thread id can outlive the thread it names — most commonly in local dev,
 * where `mda dev`'s in-memory store empties on every restart, but the same
 * thing happens to a real deployment if it's ever recreated. Rather than
 * surface that as a dead end, `sendMessage`'s 404 clears the stale id and
 * starts a fresh thread transparently — the alternative is a conversation
 * that errors forever until someone thinks to sign out and back in.
 */
async function sendResilient(
  accessToken: string,
  threadId: string,
  message: string,
): Promise<{ threadId: string; messages: AgentMessage[] }> {
  try {
    return { threadId, messages: await sendMessage(accessToken, threadId, message) };
  } catch (e) {
    if (!(e instanceof AgentError) || e.status !== 404) throw e;
    await clearThread();
    const freshId = await createThread(accessToken);
    return { threadId: freshId, messages: await sendMessage(accessToken, freshId, message) };
  }
}
export default function Talk() {
  const { height } = useWindowDimensions();
  const compact = height < 700;
  const { session } = useAuth();
  const { entryId: entryIdParam } = useLocalSearchParams<{ entryId?: string }>();
  const entryId = Array.isArray(entryIdParam) ? entryIdParam[0] : entryIdParam;
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [kept, setKept] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [draftMoods, setDraftMoods] = useState<string[]>([]);
  const [moodPickerOpen, setMoodPickerOpen] = useState(false);
  const scroller = useRef<ScrollView>(null);
  // Guards a "Talk it through" entry against being introduced twice in one
  // mount; the marker check below (against the loaded thread history) is
  // what protects it across app restarts and re-focuses.
  const primed = useRef<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      let live = true;
      (async () => {
        if (!session) return;
        let id = await getThreadId();
        if (!live) return;
        setThreadId(id);
        let history: AgentMessage[] = [];
        if (id) {
          try {
            history = await fetchThreadHistory(session.access_token, id);
            if (live) setMessages(history);
          } catch (e) {
            if (e instanceof AgentError && e.status === 404) {
              // This id is gone server-side — most likely `mda dev` restarted
              // since it was created. Forget it and carry on as a fresh
              // thread rather than erroring on every visit to this screen.
              await clearThread();
              id = null;
              if (live) setThreadId(null);
            } else {
              if (live) setError(e instanceof Error ? e.message : "Could not load the conversation.");
              return;
            }
          }
        }

        if (!entryId || primed.current.has(entryId)) return;
        const marker = `entry_id=${entryId}`;
        if (history.some((m) => m.type === "human" && m.content.includes(marker))) {
          primed.current.add(entryId);
          return;
        }
        primed.current.add(entryId);
        try {
          const entry = await fetchEntry(entryId);
          if (!entry || !live) return;
          setSending(true);
          const threadIdForSend = id ?? (await ensureThread(session.access_token));
          const { threadId: finalId, messages: result } = await sendResilient(
            session.access_token,
            threadIdForSend,
            entryToMessage(entry),
          );
          if (live) {
            setThreadId(finalId);
            setMessages(result);
          }
        } catch (e) {
          if (live) setError(e instanceof Error ? e.message : "Could not start that conversation.");
        } finally {
          if (live) setSending(false);
        }
      })();
      return () => {
        live = false;
      };
    }, [session, entryId]),
  );

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    // The current Figma phase is intentionally testable before the redesigned
    // sign-in exists. A real session still uses the agent; otherwise the UI
    // advances locally through representative conversation states.
    if (!session) {
      const aiCount = messages.filter((message) => message.type === "ai").length;
      const response = PREVIEW_RESPONSES[Math.min(Math.max(aiCount - 1, 0), PREVIEW_RESPONSES.length - 1)];
      setInput("");
      setError(null);
      setMessages((current) =>
        aiCount === 0
          ? [
              { type: "ai", content: PREVIEW_OPENING_QUESTION },
              { type: "human", content: text },
              { type: "ai", content: PREVIEW_RESPONSES[0] },
            ]
          : [...current, { type: "human", content: text }, { type: "ai", content: response }],
      );
      return;
    }

    setSending(true);
    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { type: "human", content: text }]);
    try {
      const id = threadId ?? (await ensureThread(session.access_token));
      const { threadId: finalId, messages: result } = await sendResilient(session.access_token, id, text);
      setThreadId(finalId);
      setMessages(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't send. Try again?");
    } finally {
      setSending(false);
    }
  }

  async function keep(index: number) {
    // A conversation that finished an existing entry (see entryId above)
    // named it in the tool call; only a from-scratch conversation, which
    // inserted a fresh row, has to fall back to "the one just created".
    const call = messages[index]?.tool_calls?.find((c) => c.name === "log_emotion_entry");
    const explicitId = typeof call?.args?.entry_id === "string" ? call.args.entry_id.trim() : "";
    const id = explicitId || (await fetchJournalEntries())[0]?.id;
    if (!id) return;
    await setAffirmationSaved(id, true);
    setKept((prev) => new Set(prev).add(index));
  }

  function openMoodPicker() {
    setDraftMoods(selectedMoods);
    setMoodPickerOpen(true);
  }

  function toggleMood(word: string) {
    setDraftMoods((current) =>
      current.includes(word) ? current.filter((selected) => selected !== word) : [...current, word],
    );
  }

  function useMoodSelection() {
    setSelectedMoods(draftMoods);
    setInput(`I am feeling ${listWords(draftMoods.map((word) => word.toLowerCase()))}.`);
    setMoodPickerOpen(false);
  }

  const visible = messages.map((m, i) => ({ m, i })).filter(({ m }) => isVisible(m) || affirmationIn(m));
  const metadata = session?.user.user_metadata;
  const displayName =
    (typeof metadata?.first_name === "string" && metadata.first_name.trim()) ||
    (typeof metadata?.full_name === "string" && metadata.full_name.trim().split(/\s+/)[0]) ||
    "Xuexin";

  return (
    <LinearGradient
      colors={["#FBF6F1", "#F8F3EC", "#F1EDE7"]}
      locations={[0, 0.5, 1]}
      start={{ x: 0.42, y: 0 }}
      end={{ x: 0.6, y: 1 }}
      style={styles.safe}
    >
      <Image source={visible.length === 0 ? talkLightSource : talkActiveLight} resizeMode="stretch" style={styles.lightSource} />
      <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
        <AppMenu active="talk" />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.safe} keyboardVerticalOffset={72}>
          <ScrollView
            ref={scroller}
            contentContainerStyle={[styles.thread, visible.length > 0 && styles.threadActive]}
            onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
          >
            {visible.length === 0 && !sending ? (
              <View style={[styles.opening, compact && styles.openingCompact]}>
                <View style={[styles.greeting, compact && styles.greetingCompact]}>
                  <Text style={styles.greetingTitle}>
                    Hi {displayName},{"\n"}how are you doing?
                  </Text>
                  <Text variant="body.small" style={styles.center}>
                    You can begin anywhere.
                  </Text>
                </View>
                <View style={styles.suggestions}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={openMoodPicker}
                    style={({ pressed }) => [styles.suggestion, pressed && styles.suggestionPressed]}
                  >
                    <Text style={styles.suggestionText}>I am feeling...</Text>
                    {selectedMoods.length > 0 ? (
                      <View style={styles.selectionCount}>
                        <Text variant="ui.caption">{selectedMoods.length}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setInput("I want to talk about ")}
                    style={({ pressed }) => [styles.suggestion, pressed && styles.suggestionPressed]}
                  >
                    <Text style={styles.suggestionText}>I want to talk about...</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setInput("I feel bad because ")}
                    style={({ pressed }) => [styles.suggestion, pressed && styles.suggestionPressed]}
                  >
                    <Text style={styles.suggestionText}>I feel bad...</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
            {visible.map(({ m, i }) => {
              const line = m.type === "ai" ? affirmationIn(m) : null;
              return (
                <View key={i} style={styles.turn}>
                  {isVisible(m) && <ChatBubble role={m.type === "human" ? "user" : "ai"} text={m.content} />}
                  {line && (
                    <View style={styles.keepCard}>
                      <Text variant="body.overline" tone="secondary">
                        One line to keep
                      </Text>
                      <Text variant="body.large">{line}</Text>
                      <Pressable
                        onPress={() => keep(i)}
                        disabled={kept.has(i)}
                        accessibilityRole="button"
                        style={({ pressed }) => [styles.keepChip, kept.has(i) && styles.keptChip, pressed && { opacity: 0.85 }]}
                      >
                        <Star size={12} color={tokens.color.semantic.text.primary} fill={kept.has(i) ? tokens.color.semantic.text.primary : "transparent"} />
                        <Text variant="ui.label-default">{kept.has(i) ? "Kept" : "Keep this"}</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
            {error ? (
              <Text variant="body.small" color={tokens.color.primitives.mood["high-unpleasant"].text} style={styles.error}>
                {error}
              </Text>
            ) : null}
          </ScrollView>

          <View style={styles.composerWrap}>
            <View style={styles.composer}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Share a thought..."
                placeholderTextColor={tokens.color.semantic.text.tertiary}
                style={styles.input}
                multiline
                onSubmitEditing={send}
                blurOnSubmit
              />
              <Pressable
                onPress={send}
                disabled={sending || !input.trim()}
                accessibilityRole="button"
                accessibilityLabel="Send message"
                style={({ pressed }) => [
                  styles.send,
                  (sending || !input.trim()) && styles.sendOff,
                  pressed && { opacity: 0.85 },
                ]}
              >
                {sending ? (
                  <Text variant="body.default-bold" tone="inverse">
                    …
                  </Text>
                ) : (
                  <ArrowUp size={18} strokeWidth={2.5} color={tokens.color.semantic.text.inverse} />
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
        <MoodPickerSheet
          visible={moodPickerOpen}
          selectedWords={draftMoods}
          onToggle={toggleMood}
          onCancel={() => setMoodPickerOpen(false)}
          onDone={useMoodSelection}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  lightSource: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
  thread: { paddingBottom: tokens.spacing["12"], flexGrow: 1 },
  threadActive: { paddingTop: 78 },
  turn: { gap: tokens.spacing["10"], marginBottom: 42 },
  opening: { flexGrow: 1, paddingHorizontal: tokens.spacing["24"], paddingTop: 44 },
  openingCompact: { paddingTop: 32 },
  greeting: { marginTop: tokens.spacing["64"], alignItems: "center", gap: tokens.spacing["8"] },
  greetingCompact: { marginTop: tokens.spacing["40"] },
  greetingTitle: { fontFamily: "Lora_700Bold", fontSize: 26, lineHeight: 33, color: tokens.color.semantic.text.primary, textAlign: "center" },
  center: { textAlign: "center" },
  suggestions: { marginTop: "auto", paddingBottom: tokens.spacing["16"], alignItems: "flex-start", gap: tokens.spacing["8"] },
  suggestion: {
    minHeight: 40,
    minWidth: 180,
    maxWidth: 250,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing["12"],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.82)",
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    paddingHorizontal: tokens.spacing["12"],
    shadowColor: tokens.color.semantic.text.primary,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  suggestionPressed: { opacity: 0.72 },
  suggestionText: { fontFamily: "Lora_400Regular", fontSize: 15, lineHeight: 20, color: "rgba(53, 40, 64, 0.92)" },
  selectionCount: {
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: tokens.color.primitives.mood["high-unpleasant"].light,
  },
  keepCard: {
    marginHorizontal: tokens.spacing["16"],
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing["16"],
    gap: tokens.spacing["10"],
    maxWidth: "88%",
  },
  keepChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing["6"],
    backgroundColor: tokens.color.semantic.interactive.primary,
    borderRadius: tokens.radius.full,
    paddingVertical: tokens.spacing["8"],
    paddingHorizontal: tokens.spacing["12"],
  },
  keptChip: { backgroundColor: tokens.color.primitives.plum["200"] },
  error: { paddingHorizontal: tokens.spacing["16"] },
  composerWrap: { paddingHorizontal: tokens.spacing["16"], paddingVertical: tokens.spacing["8"] },
  composer: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: tokens.spacing["8"],
    borderRadius: tokens.radius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.82)",
    backgroundColor: "rgba(255, 255, 255, 0.48)",
    paddingLeft: tokens.spacing["16"],
    paddingRight: tokens.spacing["4"],
    paddingVertical: tokens.spacing["4"],
  },
  input: {
    ...tokens.typography.body.default,
    flex: 1,
    color: tokens.color.semantic.text.primary,
    paddingVertical: tokens.spacing["8"],
    maxHeight: 120,
  },
  send: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.color.primitives.neutral.dark,
    borderRadius: 18,
  },
  sendOff: { opacity: 0.45 },
});
