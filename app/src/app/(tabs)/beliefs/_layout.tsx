import { Stack } from "expo-router";
import { tokens } from "../../../theme";

export default function BeliefsLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.color.semantic.bg.primary } }} />;
}
