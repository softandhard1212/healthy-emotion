/**
 * Font loading. The names registered here must match the `fontFamily` strings
 * that `scripts/build-tokens.mjs` writes into the generated typography styles —
 * React Native resolves a font by that exact name, and a mismatch silently
 * falls back to the system face instead of erroring.
 */
import {
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";
import {
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_700Bold,
} from "@expo-google-fonts/lora";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { GeistMono_400Regular, GeistMono_700Bold } from "@expo-google-fonts/geist-mono";
import { useFonts } from "expo-font";

/**
 * Returns false until every face is ready. Hold the splash screen on it —
 * rendering text before the faces load causes a visible reflow when the
 * metrics change from the system fallback to Lora/Nunito.
 */
export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    GeistMono_400Regular,
    GeistMono_700Bold,
  });
  return loaded;
}
