import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenBackground } from "../../components/ScreenBackground";
import { SectionHeader } from "../../components/SectionHeader";
import { Text } from "../../theme/Text";
import { tokens } from "../../theme";

/** Placeholder — the shell routes here; the screen itself is not built yet. */
export default function Journal() {
  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <SectionHeader overline="Journal" title="Journal" />
        <Text variant="body.default" tone="secondary" style={styles.note}>
          Your entries and the shape of the month will show here.
        </Text>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, padding: tokens.spacing["28"], gap: tokens.spacing["16"] },
  note: { marginTop: tokens.spacing["8"] },
});
