import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { Text } from "../theme/Text";
import { tokens } from "../theme";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * The three buttons in the spec.
 *
 * Note the label is dark on all of them, coral primary included — the spec is
 * explicit that button text is never white. It reads as a mistake next to the
 * usual white-on-accent convention, so it is worth stating: it is deliberate,
 * and it is what keeps the coral legible at 15px.
 *
 * Primary and secondary also take different faces (Nunito Bold 15 vs Lora Bold
 * 16), which is why each variant names its own variant token rather than
 * sharing one "button" style.
 */
export function Button({ label, onPress, variant = "primary", disabled, style }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "ghost" && styles.ghost,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text
        variant={variant === "secondary" ? "body.large-bold" : "heading.h4"}
        color={tokens.color.semantic.text.primary}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.full,
    paddingVertical: 14,
    paddingHorizontal: tokens.spacing["24"],
    // 48 keeps every button at the minimum comfortable touch target.
    minHeight: 48,
  },
  primary: { backgroundColor: tokens.color.semantic.interactive.primary },
  secondary: {
    borderWidth: 1.5,
    borderColor: "rgba(53, 40, 64, 0.2)",
    backgroundColor: "transparent",
  },
  ghost: { backgroundColor: "transparent", paddingHorizontal: tokens.spacing["16"] },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.85 },
});
