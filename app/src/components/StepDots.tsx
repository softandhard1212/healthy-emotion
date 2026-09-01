import { StyleSheet, View } from "react-native";
import { tokens } from "../theme";

/** The three-step indicator at the top of every check-in screen. */
export function StepDots({ active }: { active: 0 | 1 | 2 }) {
  return (
    <View style={styles.dots} accessible={false}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.dot, i === active && styles.active]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: "row", gap: tokens.spacing["4"], marginBottom: tokens.spacing["8"] },
  dot: { height: 4, width: 14, borderRadius: 2, backgroundColor: "rgba(53, 40, 64, 0.2)" },
  active: { width: 26, backgroundColor: tokens.color.semantic.text.primary },
});
