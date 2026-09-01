import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { ScreenBackground } from "../components/ScreenBackground";
import { Button } from "../components/Button";
import { Text } from "../theme/Text";
import { tokens } from "../theme";

/** The lines the cycler steps through; the last repeats the first so the snap back is seamless. */
const LINES = ["return to yourself", "see more clearly", "feel life again", "return to yourself"];
/** Line pitch in the design; also the `hero-serif` line height. */
const PITCH = 41;
/** From the frame's keyframes: hold ~1.2s, slide 0.5s, three times, then snap home and hold. */
const HOLD = 1200;
const SLIDE = 500;

const STEPS = ["Name the feeling", "Talk it through", "See the pattern"];

export default function Onboarding() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const y = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    const ease = Easing.inOut(Easing.ease);
    y.value = withRepeat(
      withSequence(
        withDelay(HOLD, withTiming(-PITCH, { duration: SLIDE, easing: ease })),
        withDelay(HOLD, withTiming(-PITCH * 2, { duration: SLIDE, easing: ease })),
        withDelay(HOLD, withTiming(-PITCH * 3, { duration: SLIDE, easing: ease })),
        withDelay(HOLD + 500, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    );
  }, [reduceMotion, y]);

  const cycler = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.hero}>
          <Text variant="brand.hero" color="rgba(53, 40, 64, 0.92)">A place to</Text>
          <View style={styles.window}>
            <Animated.View style={cycler}>
              {LINES.map((line, i) => (
                <Text key={i} variant="brand.hero-serif" color="rgba(53, 40, 64, 0.92)" numberOfLines={1}>{line}</Text>
              ))}
            </Animated.View>
          </View>
        </View>

        <View style={styles.steps}>
          {STEPS.map((s, i) => (
            <View key={s} style={styles.step}>
              <View style={styles.num}>
                <Text variant="body.small-bold">{i + 1}</Text>
              </View>
              <Text variant="body.large-bold" style={{ fontSize: 16 }}>{s}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Button label="Start" variant="secondary" onPress={() => router.replace("/login")} />
          <Pressable onPress={() => router.replace("/login")} accessibilityRole="link" style={styles.link}>
            <Text variant="body.default-bold">I already have an account</Text>
          </Pressable>
          <Text variant="body.small" style={[styles.crisis, { fontSize: 11, lineHeight: 15 }]}>
            Not a crisis service. If you're in danger or thinking of harming yourself, call or text 988.
          </Text>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: tokens.spacing["28"] },
  hero: { marginTop: "22%" },
  window: { height: PITCH, overflow: "hidden" },
  steps: { marginTop: tokens.spacing["48"], gap: tokens.spacing["24"] },
  step: { flexDirection: "row", alignItems: "center", gap: tokens.spacing["16"] },
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: tokens.color.primitives.plum["200"], alignItems: "center", justifyContent: "center" },
  footer: { marginTop: "auto", gap: tokens.spacing["16"], paddingBottom: tokens.spacing["16"] },
  link: { alignSelf: "center" },
  crisis: { textAlign: "center", opacity: 0.8 },
});
