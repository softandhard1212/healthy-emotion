import { Pressable, StyleSheet } from "react-native";
import { Text } from "../theme/Text";
import { tokens } from "../theme";

export interface ContextTagProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** What a check-in was about — work, sleep, family. Default and selected states. */
export function ContextTag({ label, selected, onPress }: ContextTagProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tag,
        selected ? styles.selected : styles.default,
        pressed && styles.pressed,
      ]}
    >
      <Text variant="heading.h4">{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.spacing["10"],
    paddingHorizontal: tokens.spacing["16"],
    minHeight: 44,
    justifyContent: "center",
  },
  default: {
    backgroundColor: "rgba(255, 255, 255, 0.44)",
    borderWidth: 1,
    borderColor: "rgba(53, 40, 64, 0.15)",
  },
  selected: { backgroundColor: tokens.color.primitives.plum["200"] },
  pressed: { opacity: 0.8 },
});
