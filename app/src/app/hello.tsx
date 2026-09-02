import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenBackground } from "../components/ScreenBackground";
import { Text } from "../theme/Text";
import { tokens } from "../theme";

/** `00 · Hello` — the whole frame is the tap target in the prototype. */
export default function Hello() {
  const router = useRouter();
  return (
    <ScreenBackground>
      <Pressable style={styles.fill} onPress={() => router.replace("/onboarding")} accessibilityRole="button" accessibilityLabel="Continue">
        <View style={styles.center}>
          <Text variant="brand.hero" color="rgba(53, 40, 64, 0.92)">Simply</Text>
          <Text variant="brand.wordmark" color="rgba(53, 40, 64, 0.55)" style={styles.wordmark}>Be</Text>
        </View>
      </Pressable>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: tokens.spacing["8"] },
  wordmark: { textShadowColor: "rgba(53, 40, 64, 0.2)", textShadowOffset: { width: 0, height: 6 }, textShadowRadius: 16 },
});
