import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuth } from "../lib/AuthContext";
import { useAuthLink } from "../lib/authLink";
import { useAppFonts, tokens } from "../theme";

SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden, or the module is unavailable in this context. Not fatal:
  // the worst case is the splash disappearing a frame early.
});

function Root() {
  // Catches the magic link coming back from the browser.
  useAuthLink();
  const fontsLoaded = useAppFonts();
  const { loading } = useAuth();
  const ready = fontsLoaded && !loading;

  useEffect(() => {
    // Held until the faces are in: showing text in the system fallback and
    // then swapping to Lora reflows every line, which is very visible.
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: tokens.color.semantic.bg.primary },
      }}
    >
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <Root />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
