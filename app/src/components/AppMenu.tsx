import { useState } from "react";
import { BlurView } from "expo-blur";
import { useRouter, type Href } from "expo-router";
import { Alert, Image, Modal, Pressable, StyleSheet, View } from "react-native";
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
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open navigation"
        hitSlop={8}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
      >
        <Text variant="body.small-bold">•••</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close navigation"
            onPress={() => setOpen(false)}
            style={styles.backdrop}
          />
          <View style={styles.sidebar}>
            <BlurView intensity={45} tint="light" pointerEvents="none" style={styles.blurLayer} />
            <SafeAreaView edges={["top", "bottom"]} style={styles.sidebarSafe}>
              <View style={styles.navigation}>
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
                        selected && styles.navigationItemSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={styles.labelGroup}>
                        <Text style={styles.navigationLabel}>{item.label}</Text>
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
                style={({ pressed }) => [styles.settings, pressed && styles.pressed]}
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
    width: 220,
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
  navigation: { gap: tokens.spacing["12"] },
  navigationItem: {
    width: 180,
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
  navigationItemSelected: { borderColor: "rgba(255, 255, 255, 0.84)" },
  labelGroup: { gap: tokens.spacing["2"] },
  navigationLabel: {
    fontFamily: "Lora_700Bold",
    fontSize: 25,
    lineHeight: 32,
    color: tokens.color.semantic.text.primary,
  },
  navigationDescription: {
    fontFamily: "Nunito_400Regular",
    fontSize: 11,
    lineHeight: 15,
    color: "#6E6074",
  },
  currentMarker: { width: 7, height: 4 },
  settings: {
    width: 180,
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
  settingsIcon: { width: 18, height: 18 },
  settingsLabel: {
    fontFamily: "Lora_700Bold",
    fontSize: 20,
    lineHeight: 28,
    color: tokens.color.semantic.text.primary,
  },
  pressed: { opacity: 0.7 },
});
