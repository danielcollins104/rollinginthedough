export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const oauthBase = () => window.location.origin;

/**
 * Get the Supabase OAuth authorization URL for a given provider.
 * Redirects to /api/oauth/callback after the user authorizes.
 */
export const getOAuthUrl = (provider: string, redirectUri?: string) => {
  const callback = redirectUri || `${oauthBase()}/api/oauth/callback`;
  const state = btoa(JSON.stringify({ redirectUri: callback, provider }));
  const url = new URL(`${oauthBase()}/api/oauth/authorize`);
  url.searchParams.set("provider", provider);
  url.searchParams.set("redirectUri", callback);
  url.searchParams.set("state", state);
  return url.toString();
};

// Legacy — kept for backwards compatibility during migration
export const getLoginUrl = () => getOAuthUrl("google");
