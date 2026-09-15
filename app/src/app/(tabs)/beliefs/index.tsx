import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppMenu } from "../../../components/AppMenu";
import { Text } from "../../../theme/Text";
import { tokens } from "../../../theme";
import { BELIEF_SECTIONS, type BeliefCardData } from "../../../lib/beliefs";

function BeliefCard({ belief, width }: { belief: BeliefCardData; width: number }) {
  const router = useRouter();
  const wide = belief.cardWidth === "wide";
  const assetWidth = belief.artwork === "full" ? width : wide ? (width - 16) / 2 : width + 9;

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={belief.title} onPress={() => router.push(`/beliefs/${belief.id}` as Href)} style={({ pressed }) => pressed && styles.pressed}>
      <LinearGradient colors={[...belief.colors]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.card, { width, height: belief.cardHeight }]}>
        <Image source={belief.image} resizeMode="stretch" style={[styles.artwork, { width: assetWidth, height: belief.imageHeight, top: belief.imageTop, left: belief.artwork === "full" || wide ? 0 : -4 }]} />
        <BlurView intensity={24} tint="light" style={[styles.labelGlass, wide ? styles.labelWide : styles.labelSmall]}>
          <Text style={[styles.meta, !wide && styles.metaSmall]}>{belief.meta}</Text>
          <Text style={[styles.title, !wide && styles.titleSmall]} numberOfLines={2}>{belief.title}</Text>
          {belief.cue ? <Text style={styles.cue}>{belief.cue}</Text> : null}
        </BlurView>
      </LinearGradient>
    </Pressable>
  );
}

export default function Beliefs() {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(342, width - 48);
  const smallWidth = (contentWidth - 16) / 2;

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <View style={styles.menuPosition}><AppMenu active="beliefs" /></View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {BELIEF_SECTIONS.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionLabel}>{section.title}</Text>
              <View style={[styles.grid, { width: contentWidth }]}>
                {section.cards.map((belief) => <BeliefCard key={belief.id} belief={belief} width={belief.cardWidth === "wide" ? contentWidth : smallWidth} />)}
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.color.semantic.bg.primary },
  safe: { flex: 1 },
  menuPosition: { position: "absolute", left: 24, top: 0, zIndex: 2 },
  content: { alignItems: "center", gap: tokens.spacing["32"], paddingTop: 56, paddingHorizontal: tokens.spacing["24"], paddingBottom: tokens.spacing["40"] },
  section: { gap: tokens.spacing["16"] },
  sectionLabel: { fontFamily: "Nunito_800ExtraBold", fontSize: 10, lineHeight: 14, letterSpacing: 1.2, color: tokens.color.semantic.text.secondary },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: tokens.spacing["16"] },
  card: { overflow: "hidden", borderRadius: tokens.radius.lg },
  artwork: { position: "absolute" },
  labelGlass: { position: "absolute", overflow: "hidden", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.9)", backgroundColor: "rgba(255, 255, 255, 0.18)", paddingHorizontal: 10, paddingTop: 8 },
  labelWide: { left: 16, right: 16, bottom: 16, height: 72, borderRadius: tokens.radius.lg, paddingHorizontal: 15, paddingTop: 11 },
  labelSmall: { left: 9, right: 9, bottom: 10, height: 66, borderRadius: tokens.radius.md },
  meta: { fontFamily: "Nunito_800ExtraBold", fontSize: 9, lineHeight: 12, letterSpacing: 1, color: tokens.color.semantic.text.secondary },
  metaSmall: { fontSize: 8, lineHeight: 10, letterSpacing: 0.8 },
  title: { fontFamily: "Lora_700Bold", fontSize: 19, lineHeight: 25, color: tokens.color.semantic.text.primary },
  titleSmall: { fontSize: 15, lineHeight: 18 },
  cue: { fontFamily: "Nunito_600SemiBold", fontSize: 11, lineHeight: 16, color: tokens.color.semantic.text.secondary },
  pressed: { opacity: 0.82 },
});
