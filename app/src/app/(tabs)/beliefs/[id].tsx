import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { Image, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AppMenu } from "../../../components/AppMenu";
import { beliefById } from "../../../lib/beliefs";
import { tokens } from "../../../theme";

export default function BeliefDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const belief = beliefById(id);
  if (!belief) return <View style={styles.fallback}><AppMenu active="beliefs" /></View>;

  return (
    <LinearGradient colors={[...belief.colors]} style={styles.screen}>
      <StatusBar style="dark" />
      <Image source={belief.image} resizeMode="contain" style={styles.artwork} />
      <View style={styles.menuPosition}><AppMenu active="beliefs" /></View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: "hidden" },
  artwork: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
  menuPosition: { position: "absolute", left: 24, top: 44 },
  fallback: { flex: 1, paddingTop: 44, paddingLeft: 24, backgroundColor: tokens.color.semantic.bg.primary },
});
