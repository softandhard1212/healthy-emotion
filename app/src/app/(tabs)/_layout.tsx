import { Tabs } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookOpen, Circle, MessageCircle, Waves } from "lucide-react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Text } from "../../theme/Text";
import { tokens } from "../../theme";
import { TABS } from "../../lib/navigation";

const ICONS = {
  circle: Circle,
  "message-circle": MessageCircle,
  waves: Waves,
  "book-open": BookOpen,
} as const;

const ICON_SIZE = 22;

/**
 * The bar is drawn by hand rather than styled through the navigator's props,
 * because the active state is a font *and* an icon change together — Lora Bold
 * with a filled glyph against Lora Regular at half opacity with an outlined
 * one. Expressing that through tabBarLabelStyle alone is not possible.
 *
 * Bottom padding comes from the safe-area inset rather than the spec's flat
 * 22px, which was measured on a device with a home indicator. On a device
 * without one, 22px of dead space below the labels reads as a mistake.
 */
function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, tokens.spacing["12"]) }]}>
      {state.routes.map((route, index) => {
        const tab = TABS.find((t) => t.route === route.name) ?? TABS[index];
        const Icon = ICONS[tab.icon as keyof typeof ICONS];
        const focused = state.index === index;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            onPress={() => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={[styles.tab, !focused && styles.inactive]}
          >
            <Icon
              size={ICON_SIZE}
              color={tokens.color.semantic.text.primary}
              fill={focused ? tokens.color.semantic.text.primary : "transparent"}
            />
            <Text variant={focused ? "body.nav-label-active" : "body.nav-label"}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.id} name={tab.route} options={{ title: tab.label }} />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: tokens.color.semantic.bg.surface,
    paddingTop: tokens.spacing["12"],
    paddingHorizontal: tokens.spacing["40"],
  },
  tab: { alignItems: "center", gap: tokens.spacing["4"], minWidth: 44 },
  inactive: { opacity: 0.5 },
});
