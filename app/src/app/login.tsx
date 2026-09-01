import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenBackground } from "../components/ScreenBackground";
import { Button } from "../components/Button";
import { Text } from "../theme/Text";
import { tokens } from "../theme";
import { supabase } from "../lib/supabase";

/**
 * Sign-in by emailed link. No password to lose, and nothing about the account
 * is worth a password prompt in front of someone who opened the app because
 * they are having a bad day.
 */
export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.body}
        >
          <View style={styles.intro}>
            <Text variant="heading.display">Be</Text>
            <Text variant="body.large" tone="secondary">
              A place to name what you are feeling, and see what keeps coming back.
            </Text>
          </View>

          {sent ? (
            <Text variant="body.default">
              Check your email — there is a link waiting that will sign you in.
            </Text>
          ) : (
            <View style={styles.form}>
              <Text variant="body.small" tone="secondary">
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                inputMode="email"
                placeholder="you@example.com"
                placeholderTextColor={tokens.color.semantic.text.tertiary}
                style={styles.input}
                onSubmitEditing={send}
              />
              <View style={styles.divider} />
              {error ? (
                <Text variant="body.small" color={tokens.color.primitives.mood["high-unpleasant"].text}>
                  {error}
                </Text>
              ) : null}
              <Button
                label={busy ? "Sending…" : "Send me a link"}
                variant="secondary"
                onPress={send}
                disabled={busy || !email.includes("@")}
                style={styles.cta}
              />
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { flex: 1, justifyContent: "center", padding: tokens.spacing["28"], gap: tokens.spacing["48"] },
  intro: { gap: tokens.spacing["12"] },
  form: { gap: tokens.spacing["8"] },
  input: {
    ...tokens.typography.ui.input,
    color: tokens.color.semantic.text.primary,
    paddingVertical: tokens.spacing["8"],
  },
  divider: { height: 1, backgroundColor: "rgba(53, 40, 64, 0.15)" },
  cta: { marginTop: tokens.spacing["16"] },
});
