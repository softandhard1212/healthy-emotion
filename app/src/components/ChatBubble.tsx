import { StyleSheet, View } from "react-native";
import { Text } from "../theme/Text";

export interface ChatBubbleProps {
  role: "user" | "ai";
  text: string;
}

/**
 * One turn of the current Figma conversation: the coach speaks directly on
 * the warm field; only the user's messages sit inside a glass bubble.
 */
export function ChatBubble({ role, text }: ChatBubbleProps) {
  const user = role === "user";
  return (
    <View style={[styles.row, user ? styles.rowUser : styles.rowAi]}>
      <View style={[user ? styles.user : styles.ai]}>
        <Text variant="body.default" color="#352840" style={user ? styles.userText : styles.aiText}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", paddingHorizontal: 30 },
  rowUser: { justifyContent: "flex-end" },
  rowAi: { justifyContent: "flex-start" },
  user: {
    maxWidth: "88%",
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 0.8,
    borderColor: "rgba(255, 255, 255, 0.72)",
    backgroundColor: "rgba(255, 251, 246, 0.52)",
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  ai: { maxWidth: 326 },
  userText: { fontFamily: "Lora_400Regular", fontSize: 15, lineHeight: 21 },
  aiText: { fontFamily: "Lora_400Regular", fontSize: 17, lineHeight: 24.65 },
});
