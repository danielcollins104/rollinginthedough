export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const oauthPortalUrl = () => import.meta.env.VITE_OAUTH_PORTAL_URL || "http://localhost:3000";
const appId = () => import.meta.env.VITE_APP_ID || "lucky-spins-dev";

const buildOAuthUrl = (provider?: string) => {
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(JSON.stringify({ redirectUri, provider: provider || "default" }));

  const url = new URL(`${oauthPortalUrl()}/oauth/consent`);
  url.searchParams.set("appId", appId());
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  if (provider) {
    url.searchParams.set("provider", provider);
  }
  return url.toString();
};

// Legacy — redirects to generic OAuth flow
export const getLoginUrl = () => buildOAuthUrl();

// Direct social login — pre-selects the provider on the consent page
export const getOAuthUrl = (provider: string) => buildOAuthUrl(provider);
