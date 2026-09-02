import { StyleSheet, View } from "react-native";
import { Text } from "../theme/Text";
import { tokens } from "../theme";

export interface ChatBubbleProps {
  role: "user" | "ai";
  text: string;
}

/**
 * One turn of the conversation. User bubbles sit right on the coral accent
 * with dark text, AI bubbles left on translucent white — both per the token
 * file's `chat` group. Both keep dark text: the spec is explicit that nothing
 * in this app puts white on coral.
 */
export function ChatBubble({ role, text }: ChatBubbleProps) {
  const user = role === "user";
  return (
    <View style={[styles.row, user ? styles.rowUser : styles.rowAi]}>
      <View style={[styles.bubble, user ? styles.user : styles.ai]}>
        <Text
          variant="body.default"
          color={user ? tokens.color.semantic.chat["user-text"] : tokens.color.semantic.chat["ai-text"]}
          style={styles.text}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", paddingHorizontal: tokens.spacing["16"] },
  rowUser: { justifyContent: "flex-end" },
  rowAi: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "82%",
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.spacing["12"],
    paddingHorizontal: tokens.spacing["16"],
  },
  user: { backgroundColor: tokens.color.semantic.chat["user-bubble"] },
  ai: { backgroundColor: "rgba(255, 255, 255, 0.7)" },
  // The spec sets 22px leading on chat text against the token's 24.
  text: { lineHeight: 22 },
});
