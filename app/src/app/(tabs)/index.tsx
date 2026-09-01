import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus } from "lucide-react-native";
import { ScreenBackground } from "../../components/ScreenBackground";
import { Text } from "../../theme/Text";
import { tokens } from "../../theme";

/**
 * Today — the check-in's front door, as the `04 · Check-in - calendar` frame:
 * one question and one large frosted card to tap.
 */
export default function Today() {
  const router = useRouter();
  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <View style={styles.body}>
          <Text variant="heading.h2">How are you doing?</Text>
          <Pressable onPress={() => router.push("/check-in")} accessibilityRole="button" accessibilityLabel="Start a check-in" style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
            <View style={styles.plus}>
              <Plus size={22} color={tokens.color.semantic.text.primary} />
            </View>
            <Text variant="heading.h3">Log in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { padding: tokens.spacing["28"], gap: tokens.spacing["16"] },
  card: {
    height: 300,
    borderRadius: tokens.radius["2xl"],
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing["12"],
  },
  plus: { width: 64, height: 64, borderRadius: 32, backgroundColor: tokens.color.primitives.plum["200"], alignItems: "center", justifyContent: "center" },
});
