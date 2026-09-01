import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ScreenBackground } from "../../components/ScreenBackground";
import { StepDots } from "../../components/StepDots";
import { Text } from "../../theme/Text";
import { quadrantColors, tokens } from "../../theme";
import { QUADRANTS, QUADRANT_ORDER, type QuadrantId } from "../../lib/emotions";
import { useCheckIn } from "../../lib/checkin";

/** Four circles filling most of the screen, as the `06 · Mood quadrants` frame. */
const CIRCLE = 148;

/**
 * Step 1 — which quarter of the circumplex.
 *
 * Deliberately the easiest question first: not "what do you feel" but "is it
 * high or low, and does it feel good or bad". Nobody is asked to name anything
 * yet. The answer only decides where step 2 opens; it is not a filter.
 */
export default function Quadrants() {
  const router = useRouter();
  const { update } = useCheckIn();

  function pick(id: QuadrantId) {
    update({ guess: id });
    router.push("/check-in/words");
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <StepDots active={0} />
          <Text variant="heading.h1">What are you{"\n"}feeling now?</Text>
        </View>
        <View style={styles.grid}>
          {QUADRANT_ORDER.map((id) => {
            const { bg, text } = quadrantColors(id);
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityLabel={QUADRANTS[id].title}
                accessibilityHint={QUADRANTS[id].hint}
                onPress={() => pick(id)}
                style={({ pressed }) => [styles.circle, { backgroundColor: bg }, pressed && styles.pressed]}
              >
                <Text variant="body.default-bold" color={text} style={styles.label}>
                  {QUADRANTS[id].title.replace(", ", ",\n")}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: tokens.spacing["28"], paddingTop: tokens.spacing["8"], gap: tokens.spacing["8"] },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: tokens.spacing["20"],
    paddingHorizontal: tokens.spacing["28"],
    paddingTop: tokens.spacing["40"],
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.spacing["16"],
  },
  label: { textAlign: "center" },
  pressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
});
