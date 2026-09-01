import { Pressable, StyleSheet } from "react-native";
import { Text } from "../theme/Text";
import { bubbleFill, quadrantColors, quadrantForPoint, tokens } from "../theme";
import type { Emotion } from "../lib/emotions";

export const BUBBLE_SIZE = 96;

export interface MoodBubbleProps {
  emotion: Emotion;
  selected: boolean;
  onPress: (word: string) => void;
}

/**
 * One word in the check-in field. The Tone x State component in Figma — but
 * tone is not a prop here, because it is not a free choice: it follows from
 * where the word sits on the circumplex, so passing it separately would let a
 * caller colour "angry" like a pleasant word.
 *
 * Selection is a ring in the quadrant's own colour plus a heavier weight,
 * rather than a fill change. The fill already carries meaning — how intense
 * the word is — and overriding it on selection would throw that away.
 */
export function MoodBubble({ emotion, selected, onPress }: MoodBubbleProps) {
  const quadrant = quadrantForPoint(emotion.x, emotion.y);
  const { text } = quadrantColors(quadrant);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={emotion.word}
      onPress={() => onPress(emotion.word)}
      style={({ pressed }) => [
        styles.bubble,
        { backgroundColor: bubbleFill(emotion) },
        selected && { borderColor: text, borderWidth: 2.5 },
        pressed && styles.pressed,
      ]}
    >
      <Text
        variant={selected ? "ui.label-small" : "ui.label-small"}
        color={text}
        numberOfLines={2}
        style={[styles.label, selected && styles.labelSelected]}
      >
        {emotion.word}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.spacing["8"],
    borderWidth: 2.5,
    borderColor: "transparent",
  },
  label: { textAlign: "center" },
  // The spec asks for Inter Bold when selected; the token scale tops out at
  // SemiBold for this size, which is the registered face.
  labelSelected: { fontFamily: "Inter_600SemiBold" },
  pressed: { opacity: 0.75 },
});
