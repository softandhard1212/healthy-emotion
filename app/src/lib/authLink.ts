import { useEffect } from "react";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";

/**
 * The redirect Supabase should send the magic link back to. In Expo Go this
 * resolves to an `exp://…` URL carrying the dev server's address; in a build
 * it is `be://`. Whatever it returns has to be listed under Supabase's
 * Authentication > URL Configuration > Redirect URLs, or the link is refused.
 */
export function authRedirectUrl(): string {
  return Linking.createURL("/auth");
}

/** Pull `access_token` / `refresh_token` out of a returning link, in query or fragment. */
function tokensIn(url: string): { access_token: string; refresh_token: string } | null {
  const params = new URLSearchParams(
    // Supabase puts them after `#`, but some clients rewrite it to `?`.
    (url.includes("#") ? url.split("#")[1] : url.split("?")[1]) ?? "",
  );
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  return access_token && refresh_token ? { access_token, refresh_token } : null;
}

/**
 * Completes a magic-link sign-in.
 *
 * `detectSessionInUrl` cannot do this on native — there is no `window.location`
 * for it to read — so the link has to be caught by hand: once for the URL that
 * launched a cold app, and on a listener for one that arrives while it is
 * already open. `setSession` then stores it, and the auth listener in
 * AuthContext redirects.
 */
export function useAuthLink() {
  useEffect(() => {
    async function complete(url: string | null) {
      if (!url) return;
      const tokens = tokensIn(url);
      if (tokens) await supabase.auth.setSession(tokens);
    }
    Linking.getInitialURL().then(complete);
    const sub = Linking.addEventListener("url", ({ url }) => complete(url));
    return () => sub.remove();
  }, []);
}
