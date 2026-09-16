import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { Image, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppMenu } from "../../../components/AppMenu";
import { beliefById } from "../../../lib/beliefs";
import { tokens } from "../../../theme";

export default function BeliefDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const belief = beliefById(id);
  if (!belief) {
    return (
      <SafeAreaView edges={["top"]} style={styles.fallback}>
        <AppMenu active="beliefs" />
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient colors={[...belief.colors]} style={styles.screen}>
      <StatusBar style="dark" />
      <Image source={belief.image} resizeMode="contain" style={styles.artwork} />
      <SafeAreaView edges={["top"]} pointerEvents="box-none" style={styles.menuSafe}>
        <AppMenu active="beliefs" />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: "hidden" },
  artwork: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
  menuSafe: { ...StyleSheet.absoluteFill },
  fallback: { flex: 1, backgroundColor: tokens.color.semantic.bg.primary },
});
