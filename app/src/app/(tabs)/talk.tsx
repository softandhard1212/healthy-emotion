import { useCallback, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Star } from "lucide-react-native";
import { ScreenBackground } from "../../components/ScreenBackground";
import { ChatBubble } from "../../components/ChatBubble";
import { Text } from "../../theme/Text";
import { tokens } from "../../theme";
import { useAuth } from "../../lib/AuthContext";
import { fetchThreadHistory, isVisible, sendMessage, type AgentMessage } from "../../lib/agent";
import { ensureThread, getThreadId } from "../../lib/thread";
import { fetchJournalEntries, setAffirmationSaved } from "../../lib/journal";

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
 */
export default function Talk() {
  const { session } = useAuth();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [kept, setKept] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      (async () => {
        if (!session) return;
        const id = await getThreadId();
        if (!live) return;
        setThreadId(id);
        if (id) {
          try {
            const history = await fetchThreadHistory(session.access_token, id);
            if (live) setMessages(history);
          } catch (e) {
            if (live) setError(e instanceof Error ? e.message : "Could not load the conversation.");
          }
        }
      })();
      return () => {
        live = false;
      };
    }, [session]),
  );

  async function send() {
    const text = input.trim();
    if (!text || !session || sending) return;
    setSending(true);
    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { type: "human", content: text }]);
    try {
      const id = threadId ?? (await ensureThread(session.access_token));
      setThreadId(id);
      setMessages(await sendMessage(session.access_token, id, text));
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't send. Try again?");
    } finally {
      setSending(false);
    }
  }

  async function keep(index: number) {
    const entries = await fetchJournalEntries();
    const latest = entries[0];
    if (!latest) return;
    await setAffirmationSaved(latest.id, true);
    setKept((prev) => new Set(prev).add(index));
  }

  const visible = messages.map((m, i) => ({ m, i })).filter(({ m }) => isVisible(m) || affirmationIn(m));

  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.safe} keyboardVerticalOffset={72}>
          <ScrollView
            ref={scroller}
            contentContainerStyle={styles.thread}
            onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
          >
            {visible.length === 0 && (
              <View style={styles.empty}>
                <Text variant="body.large" tone="secondary" style={styles.center}>
                  Say what's on your mind, or start a check-in from Today.
                </Text>
              </View>
            )}
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

          <View style={styles.composer}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type a message…"
              placeholderTextColor={tokens.color.semantic.text.tertiary}
              style={styles.input}
              multiline
              onSubmitEditing={send}
              blurOnSubmit
            />
            <Pressable onPress={send} disabled={sending || !input.trim()} accessibilityRole="button" style={({ pressed }) => [styles.send, (sending || !input.trim()) && styles.sendOff, pressed && { opacity: 0.85 }]}>
              <Text variant="body.default-bold">{sending ? "…" : "Send"}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  thread: { paddingTop: tokens.spacing["16"], paddingBottom: tokens.spacing["12"], gap: tokens.spacing["10"], flexGrow: 1 },
  turn: { gap: tokens.spacing["10"] },
  empty: { flex: 1, justifyContent: "center", padding: tokens.spacing["32"] },
  center: { textAlign: "center" },
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
  composer: { flexDirection: "row", alignItems: "flex-end", gap: tokens.spacing["8"], paddingHorizontal: tokens.spacing["16"], paddingVertical: tokens.spacing["10"] },
  input: {
    ...tokens.typography.body.default,
    flex: 1,
    color: tokens.color.semantic.text.primary,
    backgroundColor: tokens.color.semantic.bg.surface,
    borderRadius: tokens.radius.full,
    paddingHorizontal: tokens.spacing["16"],
    paddingVertical: tokens.spacing["12"],
    maxHeight: 120,
  },
  send: { backgroundColor: tokens.color.semantic.interactive.primary, borderRadius: tokens.radius.full, paddingHorizontal: tokens.spacing["20"], paddingVertical: 14, minHeight: 48, justifyContent: "center" },
  sendOff: { opacity: 0.45 },
});
