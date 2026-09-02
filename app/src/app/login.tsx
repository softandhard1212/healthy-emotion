import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenBackground } from "../components/ScreenBackground";
import { Button } from "../components/Button";
import { Text } from "../theme/Text";
import { tokens } from "../theme";
import { supabase } from "../lib/supabase";

/**
 * Sign in with a six-digit code, not a magic link.
 *
 * A link would be the obvious choice and it does not work here: tapping it
 * opens the system browser, and the session lands in a URL the app never
 * sees. Making that work needs deep-link handling, a scheme registered with
 * Supabase, and different behaviour under Expo Go — all to arrive back where
 * a typed code gets us with none of it. The code also survives the very
 * common case of reading mail on a different device.
 *
 * Supabase sends the code in the same email as the link, but only if the
 * Magic Link template includes `{{ .Token }}` — see README.
 */
export default function Login() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      // The journal is per signed-in user, so a first sign-in has to be able
      // to create the account rather than bouncing someone who has none.
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setStage("code");
  }

  async function verify() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    // On success the auth listener in AuthContext picks up the session and
    // the root layout redirects; nothing to do here.
    if (error) setError(error.message);
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.body}>
          <View style={styles.intro}>
            <Text variant="brand.hero" color="rgba(53, 40, 64, 0.92)">
              Welcome back
            </Text>
            <Text variant="body.large" tone="secondary">
              {stage === "email"
                ? "Your journal is private to you. Sign in with your email."
                : `We sent a six-digit code to ${email.trim()}.`}
            </Text>
          </View>

          {stage === "email" ? (
            <View style={styles.form}>
              <Text variant="body.small" tone="secondary">
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                inputMode="email"
                placeholder="you@example.com"
                placeholderTextColor={tokens.color.semantic.text.tertiary}
                style={styles.input}
                onSubmitEditing={sendCode}
                returnKeyType="send"
              />
              <View style={styles.divider} />
              {error ? <Problem message={error} /> : null}
              <Button
                label={busy ? "Sending…" : "Send me a code"}
                variant="secondary"
                onPress={sendCode}
                disabled={busy || !email.includes("@")}
                style={styles.cta}
              />
            </View>
          ) : (
            <View style={styles.form}>
              <Text variant="body.small" tone="secondary">
                Code
              </Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                autoFocus
                keyboardType="number-pad"
                inputMode="numeric"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                placeholderTextColor={tokens.color.semantic.text.tertiary}
                style={[styles.input, styles.codeInput]}
                onSubmitEditing={verify}
                returnKeyType="go"
              />
              <View style={styles.divider} />
              {error ? <Problem message={error} /> : null}
              <Button
                label={busy ? "Checking…" : "Sign in"}
                variant="secondary"
                onPress={verify}
                disabled={busy || code.trim().length < 6}
                style={styles.cta}
              />
              <Pressable
                onPress={() => {
                  setStage("email");
                  setCode("");
                  setError(null);
                }}
                style={styles.back}
                accessibilityRole="button"
              >
                <Text variant="body.small" tone="secondary">
                  Use a different email
                </Text>
              </Pressable>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function Problem({ message }: { message: string }) {
  return (
    <Text variant="body.small" color={tokens.color.primitives.mood["high-unpleasant"].text}>
      {message}
    </Text>
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
  codeInput: { letterSpacing: 8, fontSize: 22 },
  divider: { height: 1, backgroundColor: "rgba(53, 40, 64, 0.15)" },
  cta: { marginTop: tokens.spacing["16"] },
  back: { alignSelf: "center", paddingVertical: tokens.spacing["8"] },
});
