import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuth } from "../lib/AuthContext";
import { useAppFonts, tokens } from "../theme";

SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden, or the module is unavailable in this context. Not fatal:
  // the worst case is the splash disappearing a frame early.
});

/**
 * Sends the user to sign-in or into the tabs once both the session and the
 * fonts have resolved. Kept as a hook inside the provider because it needs
 * `useAuth`, which is only available below `AuthProvider`.
 */
function useAuthRedirect(ready: boolean) {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready || loading) return;
    const inTabs = segments[0] === "(tabs)" || segments[0] === "check-in";
    // Signed out and inside the app: back to the front door. The Hello,
    // Onboarding and Sign-in screens are all fine to stay on while signed out.
    if (!session && inTabs) router.replace("/hello");
    else if (session && !inTabs) router.replace("/");
  }, [ready, loading, session, segments, router]);
}

function Root() {
  const fontsLoaded = useAppFonts();
  const { loading } = useAuth();
  const ready = fontsLoaded && !loading;

  useAuthRedirect(ready);

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
      <Stack.Screen name="hello" options={{ animation: "fade" }} />
      <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
      <Stack.Screen name="login" />
      <Stack.Screen name="check-in" options={{ presentation: "modal" }} />
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
