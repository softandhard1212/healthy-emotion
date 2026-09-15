import { Stack } from "expo-router";
import { tokens } from "../../../theme";

export default function JournalLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.color.semantic.bg.primary } }} />;
}
