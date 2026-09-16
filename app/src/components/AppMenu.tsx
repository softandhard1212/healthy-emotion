import { useState } from "react";
import { BlurView } from "expo-blur";
import { useRouter, type Href } from "expo-router";
import { Alert, Image, Modal, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "../theme/Text";
import { tokens } from "../theme";

export type MainSection = "talk" | "journal" | "beliefs";

const ITEMS: { id: MainSection; label: string; description: string; href: "/talk" | "/journal" | "/beliefs" }[] = [
  { id: "talk", label: "Talk", description: "A place to begin", href: "/talk" },
  { id: "journal", label: "Journal", description: "Every day counts", href: "/journal" },
  { id: "beliefs", label: "Beliefs", description: "Patterns taking shape", href: "/beliefs" },
];

const currentMarker = require("../../assets/menu-current.png");
const settingsIcon = require("../../assets/menu-settings.png");

export function AppMenu({ active }: { active: MainSection }) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const compact = width < 360 || height < 700;
  const sidebarWidth = Math.min(260, Math.max(208, Math.round(width * 0.6)));
  const itemWidth = sidebarWidth - tokens.spacing["40"];

  return (
    <>
      <View pointerEvents="box-none" style={styles.anchor}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open navigation"
          hitSlop={8}
          onPress={() => setOpen(true)}
          style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
        >
          <Text variant="body.small-bold">•••</Text>
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close navigation"
            onPress={() => setOpen(false)}
            style={styles.backdrop}
          />
          <View style={[styles.sidebar, { width: sidebarWidth }]}>
            <BlurView intensity={45} tint="light" pointerEvents="none" style={styles.blurLayer} />
            <SafeAreaView edges={["top", "bottom"]} style={[styles.sidebarSafe, compact && styles.sidebarSafeCompact]}>
              <View style={[styles.navigation, compact && styles.navigationCompact]}>
                {ITEMS.map((item) => {
                  const selected = active === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => {
                        router.replace(item.href as Href);
                        setOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.navigationItem,
                        { width: itemWidth },
                        compact && styles.navigationItemCompact,
                        selected && styles.navigationItemSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={styles.labelGroup}>
                        <Text style={[styles.navigationLabel, compact && styles.navigationLabelCompact]}>{item.label}</Text>
                        <Text style={styles.navigationDescription}>{item.description}</Text>
                      </View>
                      {selected ? <Image source={currentMarker} resizeMode="contain" style={styles.currentMarker} /> : null}
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Settings"
                onPress={() => Alert.alert("Settings", "This screen is waiting for your next Figma design.")}
                style={({ pressed }) => [styles.settings, { width: itemWidth }, compact && styles.settingsCompact, pressed && styles.pressed]}
              >
                <Image source={settingsIcon} resizeMode="contain" style={styles.settingsIcon} />
                <Text style={styles.settingsLabel}>Settings</Text>
              </Pressable>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // AppMenu is mounted directly in each route's top SafeAreaView. Keeping this
  // anchor here makes the trigger land at the same visual height on every page.
  anchor: {
    position: "absolute",
    top: 0,
    left: tokens.spacing["24"],
    zIndex: 20,
    elevation: 20,
  },
  trigger: {
    width: 44,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  modalRoot: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(207, 213, 236, 0.28)",
    zIndex: 0,
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    overflow: "hidden",
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: "rgba(250, 247, 240, 0.9)",
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.84)",
    shadowColor: tokens.color.semantic.text.primary,
    shadowOffset: { width: 10, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 30,
    elevation: 18,
    zIndex: 1,
  },
  blurLayer: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(250, 247, 240, 0.9)" },
  sidebarSafe: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: tokens.spacing["20"],
    paddingTop: tokens.spacing["28"],
    paddingBottom: tokens.spacing["28"],
  },
  sidebarSafeCompact: {
    paddingTop: tokens.spacing["16"],
    paddingBottom: tokens.spacing["16"],
  },
  navigation: { gap: tokens.spacing["12"] },
  navigationCompact: { gap: tokens.spacing["8"] },
  navigationItem: {
    height: 77,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 18,
    paddingHorizontal: 17,
  },
  navigationItemCompact: { height: 68, paddingHorizontal: 14 },
  navigationItemSelected: { borderColor: "rgba(255, 255, 255, 0.84)" },
  labelGroup: { gap: tokens.spacing["2"] },
  navigationLabel: {
    fontFamily: "Lora_700Bold",
    fontSize: 25,
    lineHeight: 32,
    color: tokens.color.semantic.text.primary,
  },
  navigationLabelCompact: { fontSize: 23, lineHeight: 29 },
  navigationDescription: {
    fontFamily: "Nunito_400Regular",
    fontSize: 11,
    lineHeight: 15,
    color: "#6E6074",
  },
  currentMarker: { width: 7, height: 4 },
  settings: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing["10"],
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.84)",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  settingsCompact: { minHeight: 50, paddingHorizontal: 15, paddingVertical: 10 },
  settingsIcon: { width: 18, height: 18 },
  settingsLabel: {
    fontFamily: "Lora_700Bold",
    fontSize: 20,
    lineHeight: 28,
    color: tokens.color.semantic.text.primary,
  },
  pressed: { opacity: 0.7 },
});
