import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenBackground } from "../../components/ScreenBackground";
import { Button } from "../../components/Button";
import { SectionHeader } from "../../components/SectionHeader";
import { Text } from "../../theme/Text";
import { tokens } from "../../theme";

/** Today — the check-in's front door. */
export default function Today() {
  const router = useRouter();
  return (
    <ScreenBackground>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.body}>
          <SectionHeader overline="Today" title="How are you feeling now?" />
          <Text variant="body.italic" tone="secondary">
            It is ok to feel.
          </Text>
          <Button label="Start a check-in" onPress={() => router.push("/check-in")} />
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { padding: tokens.spacing["28"], gap: tokens.spacing["24"] },
});
