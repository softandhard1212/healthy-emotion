import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

/**
 * Three things differ from the browser client this replaces:
 *
 *  - Config comes from Expo's `EXPO_PUBLIC_` env vars, not `import.meta.env`.
 *  - Sessions persist in AsyncStorage; there is no localStorage on device.
 *  - `detectSessionInUrl` must be off. It reads the auth fragment back out of
 *    window.location, which does not exist here and would throw on startup.
 */
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
