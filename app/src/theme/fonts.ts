/**
 * Font loading.
 *
 * Each face is imported from its own subpath rather than from the package
 * root. That matters more than it looks: the root modules re-export every
 * weight and italic of the family, and Metro bundles what is reachable, so
 * `import { Nunito_700Bold } from "@expo-google-fonts/nunito"` ships all
 * fourteen Nunito faces. Across four families that measured 10.79 MB of fonts
 * for the eleven faces this app actually renders.
 *
 * The names registered here must match the `fontFamily` strings that
 * `scripts/build-tokens.mjs` writes into the generated typography styles.
 * React Native resolves a font by that exact name, and a mismatch does not
 * raise — it silently renders the system face instead.
 */
import { useFonts } from "expo-font";

import Nunito_600SemiBold from "@expo-google-fonts/nunito/600SemiBold/Nunito_600SemiBold.ttf";
import Nunito_700Bold from "@expo-google-fonts/nunito/700Bold/Nunito_700Bold.ttf";
import Nunito_800ExtraBold from "@expo-google-fonts/nunito/800ExtraBold/Nunito_800ExtraBold.ttf";
import Lora_400Regular from "@expo-google-fonts/lora/400Regular/Lora_400Regular.ttf";
import Lora_400Regular_Italic from "@expo-google-fonts/lora/400Regular_Italic/Lora_400Regular_Italic.ttf";
import Lora_700Bold from "@expo-google-fonts/lora/700Bold/Lora_700Bold.ttf";
import Inter_400Regular from "@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf";
import Inter_500Medium from "@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf";
import Inter_600SemiBold from "@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf";
import GeistMono_400Regular from "@expo-google-fonts/geist-mono/400Regular/GeistMono_400Regular.ttf";
import GeistMono_700Bold from "@expo-google-fonts/geist-mono/700Bold/GeistMono_700Bold.ttf";

/**
 * False until every face is ready. Hold the splash screen on it — rendering
 * text before the faces load reflows every line when the metrics change from
 * the system fallback to Lora.
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
